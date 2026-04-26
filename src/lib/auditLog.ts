import { Prisma } from '@prisma/client'
import { prisma } from './prisma'

export async function logAction(params: {
  userId?: string | null
  action: string
  entityType?: string
  entityId?: string
  metadata?: Record<string, unknown> | null
  request?: Request
}) {
  try {
    let ipAddress: string | null = null
    let userAgent: string | null = null
    if (params.request) {
      const headers = params.request.headers
      ipAddress =
        headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        headers.get('x-real-ip') ||
        null
      userAgent = headers.get('user-agent') || null
    }
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
        metadata: params.metadata != null ? (params.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        ipAddress,
        userAgent,
      },
    })
  } catch (e) {
    console.error('Audit log failed:', e)
  }
}
