import dns from 'dns';
// Prefer IPv4 over IPv6 for external telemetry and API reliability in Node.js
dns.setDefaultResultOrder('ipv4first');

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { getSupabaseServiceAdmin } from '@/lib/supabase';
import { fetchLiveWeather, fetchReverseGeocode } from '@/lib/env-enrichment';
import {
  checkRateLimit,
  computeSha256Hex,
  decryptField,
  encryptField,
  generateCryptographicReceipt,
  sanitizeCitizenInput,
  verifyMediaMagicBytes,
  withSecurityHeaders,
} from '@/lib/security';
import type {
  AIReasoningLog,
  CryptographicAudit,
  DepartmentCode,
  DuplicateMatchResult,
  DuplicateMergeEntry,
  GeminiTriageOutput,
  GrievanceRecord,
  GrievancesSummary,
  GrievanceStatus,
  UrgencyLevel,
} from '@/types/grievance';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_DEPARTMENTS: DepartmentCode[] = ['PWD-ROADS', 'WATER-SAN', 'ENV-POLL', 'ELEC-GRID'];
const VALID_URGENCY: UrgencyLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

/**
 * Removes raw pgvector embedding array and PostGIS geography binary
 * from database records before sending JSON responses to frontend clients.
 * Transparently decrypts AES-256-GCM encrypted fields (address, work order)
 * so frontend clients seamlessly receive verified, plaintext values.
 */
function cleanGrievance(row: Record<string, unknown> | null): GrievanceRecord {
  if (!row) return row as unknown as GrievanceRecord;
  const { embedding, location, ...rest } = row;
  const record = { ...rest } as Record<string, unknown>;

  // Transparently decrypt address if stored as AES-256-GCM envelope
  if (typeof record.address === 'string' && record.address.startsWith('enc:v1:')) {
    record.address = decryptField(record.address);
  }

  // Transparently decrypt official_work_order_draft inside ai_reasoning_log if encrypted
  if (record.ai_reasoning_log && typeof record.ai_reasoning_log === 'object') {
    const reasoning = { ...(record.ai_reasoning_log as Record<string, unknown>) };
    if (
      typeof reasoning.official_work_order_draft === 'string' &&
      reasoning.official_work_order_draft.startsWith('enc:v1:')
    ) {
      reasoning.official_work_order_draft = decryptField(reasoning.official_work_order_draft);
    }
    record.ai_reasoning_log = reasoning;
  }

  return record as unknown as GrievanceRecord;
}

/**
 * Resolves safe file extension from File metadata or MIME type.
 */
function getFileExtension(file: File): string {
  const parts = file.name ? file.name.split('.') : [];
  if (parts.length > 1) {
    const ext = parts.pop()?.toLowerCase();
    if (ext && /^[a-z0-9]+$/.test(ext)) {
      return ext;
    }
  }
  if (file.type.startsWith('image/')) {
    return file.type.replace('image/', '').replace('jpeg', 'jpg');
  }
  if (file.type.startsWith('audio/')) {
    return file.type.replace('audio/', '').replace('mpeg', 'mp3');
  }
  return 'bin';
}

/**
 * Executes multimodal civic triage with Gemini, attempting gemini-2.5-flash
 * with immediate zero-latency fallback to gemini-3-flash-preview or gemini-3.8-flash
 * in environments where earlier preview model names have been sunset.
 */
async function generateMultimodalTriage(
  ai: GoogleGenAI,
  contents: unknown[]
): Promise<GeminiTriageOutput> {
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      is_valid_civic_issue: {
        type: Type.BOOLEAN,
        description:
          'Set to false ONLY if the submission is a selfie, meme, indoor personal item, spam, or completely irrelevant to municipal public infrastructure.',
      },
      rejection_reason: {
        type: Type.STRING,
        description:
          'Clear civil explanation if rejected (e.g. "Image depicts an indoor dining table, not public civic infrastructure"). Blank or empty string if valid.',
      },
      confidence_score: {
        type: Type.NUMBER,
        description: 'Confidence score between 0.0 and 1.0.',
      },
      title: {
        type: Type.STRING,
        description: 'Concise, high-impact municipal engineering title (max 75 characters).',
      },
      synthesized_description: {
        type: Type.STRING,
        description:
          'Detailed technical defect report synthesizing citizen input, visual evidence damage assessment, and environmental exposure.',
      },
      category: {
        type: Type.STRING,
        description:
          "Strict classification: 'Road & Structural Damage', 'Water & Sewerage Leak', 'Environmental & Waste Pollution', or 'Electrical & Grid Hazard'.",
      },
      department_code: {
        type: Type.STRING,
        description:
          "Assigned municipal department. MUST be strictly 'PWD-ROADS', 'WATER-SAN', 'ENV-POLL', or 'ELEC-GRID'.",
      },
      base_severity: {
        type: Type.NUMBER,
        description: 'Base severity score from 1.0 (cosmetic) to 10.0 (catastrophic).',
      },
      final_severity_score: {
        type: Type.NUMBER,
        description:
          'Final calibrated severity from 1.0 to 10.0, amplifying base severity based on live weather (e.g. active rainfall washing out potholes, water eroding foundations, high wind near loose power lines).',
      },
      urgency_level: {
        type: Type.STRING,
        description: "Priority triage tier: 'LOW', 'MEDIUM', 'HIGH', or 'CRITICAL'.",
      },
      forensic_observations: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: '3 to 5 bullet points noting specific visual or contextual telemetry.',
      },
      environmental_impact_analysis: {
        type: Type.STRING,
        description:
          'Detailed analysis of how ambient temperature, precipitation, and wind affect the rate of deterioration or citizen danger.',
      },
      routing_justification: {
        type: Type.STRING,
        description:
          'Engineering justification for why this specific municipal department and SLA threshold were designated.',
      },
      official_work_order_draft: {
        type: Type.STRING,
        description:
          'Formal municipal work order ready for automated field dispatch, detailing equipment and personnel requirements.',
      },
    },
    required: [
      'is_valid_civic_issue',
      'rejection_reason',
      'confidence_score',
      'title',
      'synthesized_description',
      'category',
      'department_code',
      'base_severity',
      'final_severity_score',
      'urgency_level',
      'forensic_observations',
      'environmental_impact_analysis',
      'routing_justification',
      'official_work_order_draft',
    ],
  };

  const modelsToAttempt = ['gemini-2.5-flash', 'gemini-3-flash-preview', 'gemini-3.8-flash'];
  let lastError: unknown = null;

  for (const model of modelsToAttempt) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: contents as any,
        config: {
          responseMimeType: 'application/json',
          responseSchema,
        },
      });

      const responseText = response.text?.trim() || '{}';
      const parsed = JSON.parse(responseText) as GeminiTriageOutput;

      // Sanitize department_code
      if (!VALID_DEPARTMENTS.includes(parsed.department_code)) {
        if (parsed.category.toLowerCase().includes('water')) {
          parsed.department_code = 'WATER-SAN';
        } else if (parsed.category.toLowerCase().includes('electr')) {
          parsed.department_code = 'ELEC-GRID';
        } else if (parsed.category.toLowerCase().includes('pollut') || parsed.category.toLowerCase().includes('waste')) {
          parsed.department_code = 'ENV-POLL';
        } else {
          parsed.department_code = 'PWD-ROADS';
        }
      }

      // Sanitize urgency_level
      if (!VALID_URGENCY.includes(parsed.urgency_level)) {
        parsed.urgency_level =
          parsed.final_severity_score >= 8.0
            ? 'CRITICAL'
            : parsed.final_severity_score >= 6.0
            ? 'HIGH'
            : parsed.final_severity_score >= 4.0
            ? 'MEDIUM'
            : 'LOW';
      }

      // Clamp severity scores
      parsed.base_severity = Math.max(1.0, Math.min(10.0, Number(parsed.base_severity) || 5.0));
      parsed.final_severity_score = Math.max(
        1.0,
        Math.min(10.0, Number(parsed.final_severity_score) || parsed.base_severity)
      );

      return parsed;
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      if (errMsg.includes('404') || errMsg.includes('not found') || errMsg.includes('no longer available')) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('Failed to generate triage analysis across available Gemini models.');
}

/**
 * Computes 768-dimensional semantic vector embedding.
 * Prioritizes text-embedding-004 as specified, with graceful fallback to
 * gemini-embedding-001 if text-embedding-004 is sunset in the active API tier.
 */
async function generate768Embedding(ai: GoogleGenAI, textContent: string): Promise<number[]> {
  const models = ['text-embedding-004', 'gemini-embedding-001'];
  let lastError: unknown = null;

  for (const model of models) {
    try {
      const embedRes = await ai.models.embedContent({
        model,
        contents: textContent,
        config: { outputDimensionality: 768 },
      });

      const values = embedRes.embeddings?.[0]?.values;
      if (Array.isArray(values) && values.length === 768) {
        return values;
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      if (errMsg.includes('404') || errMsg.includes('not found') || errMsg.includes('no longer available')) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('Failed to produce 768-dimensional vector embedding.');
}

/**
 * POST /api/triage
 * Full 5-stage multimodal forensic triage, reverse geocoding, live meteorological enrichment,
 * 768-dim semantic embedding, and hybrid PostGIS/pgvector deduplication with military-grade
 * defense-in-depth security (magic byte verification, AES-256-GCM envelope encryption, rate limiting).
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  // 1. Sliding-Window Rate Limiting
  const forwarded = req.headers.get('x-forwarded-for');
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
  const rateLimit = checkRateLimit(clientIp, 30, 60_000);
  if (!rateLimit.allowed) {
    return withSecurityHeaders(
      NextResponse.json(
        { error: 'Too Many Requests: Rate limit exceeded. Please wait before retrying.' },
        { status: 429 }
      )
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return withSecurityHeaders(
      NextResponse.json(
        { error: 'Server Configuration Error: Missing GEMINI_API_KEY.' },
        { status: 500 }
      )
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return withSecurityHeaders(
      NextResponse.json(
        { error: 'Invalid Request: Expected multipart/form-data payload.' },
        { status: 400 }
      )
    );
  }

  // 2. Input Validation & Adversarial Injection Neutralization
  const latStr = formData.get('lat');
  const lngStr = formData.get('lng');

  if (!latStr || !lngStr) {
    return withSecurityHeaders(
      NextResponse.json(
        { error: "Validation Error: Both 'lat' and 'lng' parameters are required." },
        { status: 400 }
      )
    );
  }

  const lat = parseFloat(String(latStr));
  const lng = parseFloat(String(lngStr));

  if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
    return withSecurityHeaders(
      NextResponse.json(
        { error: 'Validation Error: Coordinates out of valid WGS-84 range (-90..90, -180..180).' },
        { status: 400 }
      )
    );
  }

  const rawDescription = formData.get('description');
  const description = rawDescription
    ? sanitizeCitizenInput(String(rawDescription).slice(0, 2000))
    : '';

  // Optional citizen whistleblower PII encryption at rest
  const rawContact = formData.get('reporter_contact');
  const citizenPiiEncrypted =
    rawContact && typeof rawContact === 'string' && rawContact.trim().length > 0
      ? encryptField(rawContact.trim())
      : null;

  const mediaEntry = formData.get('media');
  let mediaFile: File | null = null;
  if (mediaEntry && typeof mediaEntry === 'object' && 'size' in mediaEntry && (mediaEntry as File).size > 0) {
    mediaFile = mediaEntry as File;
  }

  if (!mediaFile && description.length < 10) {
    return withSecurityHeaders(
      NextResponse.json(
        {
          error:
            'Validation Error: At least one visual/audio media file OR a descriptive note of min 10 characters is required.',
        },
        { status: 400 }
      )
    );
  }

  let mediaBuffer: Buffer | null = null;
  let mediaSha256: string | null = null;
  let detectedMagicFormat = 'NONE';

  if (mediaFile) {
    if (mediaFile.size > MAX_FILE_SIZE) {
      return withSecurityHeaders(
        NextResponse.json(
          { error: 'Validation Error: Media file exceeds maximum allowed limit of 10MB.' },
          { status: 400 }
        )
      );
    }

    if (!mediaFile.type.startsWith('image/') && !mediaFile.type.startsWith('audio/')) {
      return withSecurityHeaders(
        NextResponse.json(
          { error: 'Validation Error: Unsupported media type. Only image/* or audio/* files are accepted.' },
          { status: 400 }
        )
      );
    }

    const arrayBuf = await mediaFile.arrayBuffer();
    mediaBuffer = Buffer.from(arrayBuf);

    // 3. Binary Magic-Byte Signature Verification against MIME-Spoofing
    const magicCheck = verifyMediaMagicBytes(mediaBuffer, mediaFile.type);
    if (!magicCheck.valid) {
      return withSecurityHeaders(
        NextResponse.json(
          {
            error: `Validation Error: Binary signature verification failed. Detected format '${magicCheck.detectedFormat}' does not match claimed MIME type '${mediaFile.type}'.`,
          },
          { status: 400 }
        )
      );
    }
    detectedMagicFormat = magicCheck.detectedFormat;
    mediaSha256 = computeSha256Hex(mediaBuffer);
  }

  const supabaseAdmin = getSupabaseServiceAdmin();
  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

  let uploadedFilePath: string | null = null;
  let mediaPublicUrl: string | null = null;

  try {
    // Stage 1 — Parallel Storage Upload & Geospatial/Weather Enrichment
    const uploadPromise = (async () => {
      if (!mediaFile || !mediaBuffer) return null;
      const ext = getFileExtension(mediaFile);
      const filePath = `incidents/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('grievance-media')
        .upload(filePath, mediaBuffer, {
          contentType: mediaFile.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Supabase Storage Upload Failed: ${uploadError.message}`);
      }

      uploadedFilePath = filePath;
      const { data: publicUrlData } = supabaseAdmin.storage
        .from('grievance-media')
        .getPublicUrl(filePath);

      mediaPublicUrl = publicUrlData.publicUrl;
      return { filePath, publicUrl: mediaPublicUrl };
    })();

    const [uploadResult, verifiedAddress, weatherContext] = await Promise.all([
      uploadPromise,
      fetchReverseGeocode(lat, lng),
      fetchLiveWeather(lat, lng),
    ]);

    if (uploadResult) {
      uploadedFilePath = uploadResult.filePath;
      mediaPublicUrl = uploadResult.publicUrl;
    }

    // Stage 2 — Gemini Multimodal Forensic Agent
    const promptParts: unknown[] = [];

    if (mediaFile && mediaBuffer) {
      promptParts.push({
        inlineData: {
          data: mediaBuffer.toString('base64'),
          mimeType: mediaFile.type,
        },
      });
    }

    const forensicPrompt = `
You are the Chief AI Forensic Engineering Inspector for CivicPulse, a municipal emergency triage platform.
Analyze this civic incident report with extreme technical precision.

INCIDENT TELEMETRY:
- Citizen Raw Note: "${description || '(No citizen text provided; rely on multimodal inspection)'}"
- Verified Location: ${verifiedAddress} [Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}]
- Ambient Weather Context:
    * Temperature: ${weatherContext.temperature_2m !== null ? weatherContext.temperature_2m + '°C' : 'N/A'}
    * Precipitation: ${weatherContext.precipitation !== null ? weatherContext.precipitation + ' mm' : 'N/A'}
    * Wind Speed: ${weatherContext.wind_speed_10m !== null ? weatherContext.wind_speed_10m + ' km/h' : 'N/A'}
    * Weather Condition: ${weatherContext.condition_summary}

MISSION INSTRUCTIONS:
1. Determine if this represents a legitimate public civic defect. Reject selfies, memes, indoor household items, pet pictures, or personal disputes.
2. If INVALID: Set is_valid_civic_issue=false and provide a courteous rejection_reason explaining why.
3. If VALID:
    - Synthesize a concise engineering title (max 75 chars).
    - Provide a synthesized_description summarizing root cause, visual damage, and immediate risk.
    - Classify category strictly as 'Road & Structural Damage', 'Water & Sewerage Leak', 'Environmental & Waste Pollution', or 'Electrical & Grid Hazard'.
    - Assign department_code strictly as 'PWD-ROADS', 'WATER-SAN', 'ENV-POLL', or 'ELEC-GRID'.
    - Base severity (1.0 to 10.0).
    - Final severity (1.0 to 10.0): Amplify severity when active weather accelerates damage (e.g. rain flooding open trenches, storm winds pushing trees onto wires).
    - Set urgency_level: 'LOW' (<4.0), 'MEDIUM' (4.0-5.9), 'HIGH' (6.0-7.9), or 'CRITICAL' (>=8.0).
    - List 3 to 5 concrete forensic_observations.
    - Provide environmental_impact_analysis detailing the interaction with live weather.
    - Provide routing_justification for the department SLA.
    - Draft official_work_order_draft with recommended machinery, materials, and crew dispatch.
`.trim();

    promptParts.push(forensicPrompt);

    const aiResult = await generateMultimodalTriage(ai, promptParts);

    // If marked invalid/spam/selfie, purge uploaded media and return HTTP 422
    if (!aiResult.is_valid_civic_issue) {
      if (uploadedFilePath) {
        try {
          await supabaseAdmin.storage.from('grievance-media').remove([uploadedFilePath]);
        } catch (cleanupErr) {
          console.warn('[StorageCleanup] Failed to remove rejected media file:', cleanupErr);
        }
      }

      return withSecurityHeaders(
        NextResponse.json(
          {
            status: 'REJECTED',
            reason:
              aiResult.rejection_reason ||
              'Submission does not qualify as a legitimate public civic infrastructure issue.',
          },
          { status: 422 }
        )
      );
    }

    // Stage 3 — 768-Dim Semantic Vector Embedding
    const embeddingText = `${aiResult.category} | ${aiResult.title} | ${aiResult.synthesized_description}`;
    const embeddingValues = await generate768Embedding(ai, embeddingText);
    const formattedEmbedding = JSON.stringify(embeddingValues);

    // 4. Generate Cryptographic Audit Trail & Non-Repudiation Receipt
    const workOrderEncryptedEnvelope = encryptField(aiResult.official_work_order_draft);
    const encryptedAddress = encryptField(verifiedAddress);

    const receipt = generateCryptographicReceipt({
      lat,
      lng,
      mediaHash: mediaSha256 || computeSha256Hex(description || 'EMPTY_DESCRIPTION'),
      departmentCode: aiResult.department_code,
      timestamp: new Date().toISOString(),
    });

    const cryptographicAudit: CryptographicAudit = {
      encryption_cipher: 'AES-256-GCM',
      media_sha256_fingerprint: mediaSha256,
      work_order_Encrypted_envelope: workOrderEncryptedEnvelope,
      citizen_pii_encrypted: citizenPiiEncrypted,
      receipt_id: receipt.receipt_id,
      hmac_sha256_signature: receipt.hmac_signature,
      magic_byte_format: detectedMagicFormat,
      verified_at: new Date().toISOString(),
    };

    // Stage 4 — Hybrid PostGIS (100m) + pgvector (0.82) Deduplication & Atomic Upsert
    const { data: duplicateMatches, error: rpcError } = await supabaseAdmin.rpc(
      'find_duplicate_grievance',
      {
        query_lat: lat,
        query_lng: lng,
        query_embedding: formattedEmbedding,
        radius_meters: 100.0,
        similarity_threshold: 0.82,
      }
    );

    if (rpcError) {
      console.error('[RPC find_duplicate_grievance Error]:', rpcError);
    }

    const matches = (duplicateMatches as DuplicateMatchResult[]) || [];

    // BRANCH A: Duplicate Incident Found within 100m and 0.82 Cosine Similarity
    if (matches.length > 0) {
      const bestMatch = matches[0];
      const matchedId = bestMatch.matched_id;

      const { data: existingRecord, error: fetchExistingErr } = await supabaseAdmin
        .from('grievances')
        .select('*, departments(*)')
        .eq('id', matchedId)
        .single();

      if (!fetchExistingErr && existingRecord) {
        const updatedUpvotes = (existingRecord.upvotes || 0) + 1;
        const escalatedSeverity = Math.min(
          10.0,
          Number(((existingRecord.severity_score || 0) + 0.5).toFixed(1))
        );
        const recalculatedUrgency: UrgencyLevel =
          escalatedSeverity >= 8.0
            ? 'CRITICAL'
            : escalatedSeverity >= 6.0
            ? 'HIGH'
            : escalatedSeverity >= 4.0
            ? 'MEDIUM'
            : 'LOW';

        const mergeEntry: DuplicateMergeEntry = {
          timestamp: new Date().toISOString(),
          reporter_note: description || 'Additional citizen report received at same incident sector.',
          distance_meters: Number(bestMatch.distance_meters.toFixed(2)),
          similarity: Number(bestMatch.cosine_similarity.toFixed(4)),
        };

        const existingReasoning = (existingRecord.ai_reasoning_log as AIReasoningLog) || {
          is_valid_civic_issue: true,
          confidence_score: 1.0,
          forensic_observations: [],
          environmental_impact_analysis: '',
          routing_justification: '',
          official_work_order_draft: '',
          execution_latency_ms: 0,
          duplicate_merge_history: [],
        };

        const updatedReasoningLog: AIReasoningLog = {
          ...existingReasoning,
          duplicate_merge_history: [
            ...(existingReasoning.duplicate_merge_history || []),
            mergeEntry,
          ],
          cryptographic_audit: cryptographicAudit,
        };

        const updateFields: Record<string, unknown> = {
          upvotes: updatedUpvotes,
          severity_score: escalatedSeverity,
          urgency_level: recalculatedUrgency,
          status: 'CLUSTERED' as GrievanceStatus,
          ai_reasoning_log: updatedReasoningLog,
        };

        // Attach photo if the existing incident was missing media
        let mediaAttached = false;
        if (!existingRecord.media_url && mediaPublicUrl) {
          updateFields.media_url = mediaPublicUrl;
          updateFields.media_type = mediaFile?.type || null;
          mediaAttached = true;
        }

        // Clean up unattached duplicate media file to prevent storage bloat
        if (uploadedFilePath && !mediaAttached) {
          try {
            await supabaseAdmin.storage.from('grievance-media').remove([uploadedFilePath]);
          } catch (cleanErr) {
            console.warn('[StorageCleanup] Failed to clean up unattached duplicate media:', cleanErr);
          }
        }

        const { data: updatedGrievance, error: updateErr } = await supabaseAdmin
          .from('grievances')
          .update(updateFields)
          .eq('id', matchedId)
          .select('*, departments(*)')
          .single();

        if (updateErr) {
          throw new Error(`Failed to update clustered grievance: ${updateErr.message}`);
        }

        const mergedResponse = NextResponse.json(
          {
            action: 'MERGED_DUPLICATE',
            match_metrics: {
              distance_meters: bestMatch.distance_meters,
              cosine_similarity: bestMatch.cosine_similarity,
            },
            grievance: cleanGrievance(updatedGrievance),
          },
          { status: 200 }
        );

        mergedResponse.headers.set('X-CivicPulse-Receipt-Signature', receipt.hmac_signature);
        mergedResponse.headers.set('X-CivicPulse-Receipt-Id', receipt.receipt_id);
        return withSecurityHeaders(mergedResponse);
      }
    }

    // BRANCH B: New Unique Incident
    const { data: deptData } = await supabaseAdmin
      .from('departments')
      .select('sla_hours')
      .eq('code', aiResult.department_code)
      .single();

    const slaHours = deptData?.sla_hours ?? 48;
    const slaDeadline = new Date(Date.now() + slaHours * 3600_000).toISOString();
    const executionLatencyMs = Date.now() - startTime;

    const insertPayload = {
      title: aiResult.title,
      description: description || aiResult.synthesized_description,
      category: aiResult.category,
      department_code: aiResult.department_code,
      severity_score: aiResult.final_severity_score,
      urgency_level: aiResult.urgency_level,
      status: 'TRIAGED' as GrievanceStatus,
      upvotes: 1,
      media_url: mediaPublicUrl,
      media_type: mediaFile?.type || null,
      lat,
      lng,
      location: `POINT(${lng} ${lat})`,
      address: encryptedAddress, // Stored encrypted at rest with AES-256-GCM
      weather_context: weatherContext,
      ai_reasoning_log: {
        is_valid_civic_issue: aiResult.is_valid_civic_issue,
        confidence_score: aiResult.confidence_score,
        forensic_observations: aiResult.forensic_observations,
        environmental_impact_analysis: aiResult.environmental_impact_analysis,
        routing_justification: aiResult.routing_justification,
        official_work_order_draft: aiResult.official_work_order_draft,
        execution_latency_ms: executionLatencyMs,
        duplicate_merge_history: [],
        cryptographic_audit: cryptographicAudit,
      },
      embedding: formattedEmbedding,
      sla_deadline: slaDeadline,
    };

    const { data: insertedGrievance, error: insertErr } = await supabaseAdmin
      .from('grievances')
      .insert(insertPayload)
      .select('*, departments(*)')
      .single();

    if (insertErr) {
      throw new Error(`Failed to insert new grievance: ${insertErr.message}`);
    }

    const createdResponse = NextResponse.json(
      {
        action: 'CREATED_NEW',
        grievance: cleanGrievance(insertedGrievance),
      },
      { status: 201 }
    );

    createdResponse.headers.set('X-CivicPulse-Receipt-Signature', receipt.hmac_signature);
    createdResponse.headers.set('X-CivicPulse-Receipt-Id', receipt.receipt_id);
    return withSecurityHeaders(createdResponse);
  } catch (error: any) {
    console.error('[Triage Pipeline Fatal Error]:', error);

    // Clean up newly uploaded media if an unhandled pipeline error occurred
    if (uploadedFilePath) {
      try {
        await supabaseAdmin.storage.from('grievance-media').remove([uploadedFilePath]);
      } catch (cleanupErr) {
        console.warn(
          '[StorageCleanup] Failed to remove orphaned media after pipeline failure:',
          cleanupErr
        );
      }
    }

    return withSecurityHeaders(
      NextResponse.json(
        {
          error: 'Triage Processing Failure',
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      )
    );
  }
}

/**
 * GET /api/triage
 * Real-time query of grievances with optional filtering by department_code and status,
 * computing live KPI summaries (total, critical count, clustered count, average severity).
 * Applies transparent decryption and defense-in-depth security headers.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const supabaseAdmin = getSupabaseServiceAdmin();
    const { searchParams } = new URL(req.url);

    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(200, Math.max(1, parseInt(limitParam, 10) || 100)) : 100;

    let query = supabaseAdmin
      .from('grievances')
      .select('*, departments(*)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (department && department.trim() !== '') {
      query = query.eq('department_code', department.trim());
    }

    if (status && status.trim() !== '') {
      query = query.eq('status', status.trim());
    }

    const { data: rows, error } = await query;

    if (error) {
      return withSecurityHeaders(
        NextResponse.json({ error: error.message }, { status: 500 })
      );
    }

    const grievances: GrievanceRecord[] = (rows || []).map(cleanGrievance);

    const total = grievances.length;
    const critical_count = grievances.filter((g) => g.urgency_level === 'CRITICAL').length;
    const clustered_count = grievances.filter((g) => g.status === 'CLUSTERED').length;
    const avg_severity =
      total > 0
        ? Number(
            (grievances.reduce((acc, g) => acc + (g.severity_score || 0), 0) / total).toFixed(2)
          )
        : 0;

    const summary: GrievancesSummary = {
      total,
      critical_count,
      clustered_count,
      avg_severity,
    };

    return withSecurityHeaders(
      NextResponse.json({ grievances, summary }, { status: 200 })
    );
  } catch (error) {
    return withSecurityHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal Server Error' },
        { status: 500 }
      )
    );
  }
}

/**
 * PATCH /api/triage
 * Interactive action handler enabling citizen manual upvotes, autonomous dispatching,
 * and operator resolution transitions. Enforces sliding-window rate limiting.
 */
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const forwarded = req.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
    const rateLimit = checkRateLimit(clientIp, 30, 60_000);
    if (!rateLimit.allowed) {
      return withSecurityHeaders(
        NextResponse.json(
          { error: 'Too Many Requests: Rate limit exceeded. Please wait before retrying.' },
          { status: 429 }
        )
      );
    }

    const supabaseAdmin = getSupabaseServiceAdmin();
    let body: { id?: string; action?: string };
    try {
      body = await req.json();
    } catch {
      return withSecurityHeaders(
        NextResponse.json(
          { error: 'Invalid Request: Expected JSON body containing id and action.' },
          { status: 400 }
        )
      );
    }

    const { id, action } = body;

    if (!id || typeof id !== 'string') {
      return withSecurityHeaders(
        NextResponse.json(
          { error: "Validation Error: 'id' (UUID) is required." },
          { status: 400 }
        )
      );
    }

    if (action !== 'UPVOTE' && action !== 'DISPATCH' && action !== 'RESOLVE') {
      return withSecurityHeaders(
        NextResponse.json(
          {
            error:
              "Validation Error: 'action' must be strictly 'UPVOTE', 'DISPATCH', or 'RESOLVE'.",
          },
          { status: 400 }
        )
      );
    }

    if (action === 'UPVOTE') {
      const { data: existing, error: fetchErr } = await supabaseAdmin
        .from('grievances')
        .select('upvotes, severity_score')
        .eq('id', id)
        .single();

      if (fetchErr || !existing) {
        return withSecurityHeaders(
          NextResponse.json({ error: 'Grievance not found.' }, { status: 404 })
        );
      }

      const updatedUpvotes = (existing.upvotes || 0) + 1;
      const updatedSeverity = Math.min(
        10.0,
        Number(((existing.severity_score || 0) + 0.2).toFixed(1))
      );
      const updatedUrgency: UrgencyLevel =
        updatedSeverity >= 8.0
          ? 'CRITICAL'
          : updatedSeverity >= 6.0
          ? 'HIGH'
          : updatedSeverity >= 4.0
          ? 'MEDIUM'
          : 'LOW';

      const { data: updatedGrievance, error: updateErr } = await supabaseAdmin
        .from('grievances')
        .update({
          upvotes: updatedUpvotes,
          severity_score: updatedSeverity,
          urgency_level: updatedUrgency,
        })
        .eq('id', id)
        .select('*, departments(*)')
        .single();

      if (updateErr) {
        return withSecurityHeaders(
          NextResponse.json({ error: updateErr.message }, { status: 500 })
        );
      }

      return withSecurityHeaders(
        NextResponse.json(
          { action: 'UPVOTE', grievance: cleanGrievance(updatedGrievance) },
          { status: 200 }
        )
      );
    } else if (action === 'DISPATCH') {
      const { data: updatedGrievance, error: updateErr } = await supabaseAdmin
        .from('grievances')
        .update({ status: 'DISPATCHED' as GrievanceStatus })
        .eq('id', id)
        .select('*, departments(*)')
        .single();

      if (updateErr) {
        return withSecurityHeaders(
          NextResponse.json({ error: updateErr.message }, { status: 500 })
        );
      }

      return withSecurityHeaders(
        NextResponse.json(
          { action: 'DISPATCH', grievance: cleanGrievance(updatedGrievance) },
          { status: 200 }
        )
      );
    } else {
      // action === 'RESOLVE'
      const { data: updatedGrievance, error: updateErr } = await supabaseAdmin
        .from('grievances')
        .update({ status: 'RESOLVED' as GrievanceStatus })
        .eq('id', id)
        .select('*, departments(*)')
        .single();

      if (updateErr) {
        return withSecurityHeaders(
          NextResponse.json({ error: updateErr.message }, { status: 500 })
        );
      }

      return withSecurityHeaders(
        NextResponse.json(
          { action: 'RESOLVE', grievance: cleanGrievance(updatedGrievance) },
          { status: 200 }
        )
      );
    }
  } catch (error) {
    return withSecurityHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal Server Error' },
        { status: 500 }
      )
    );
  }
}
