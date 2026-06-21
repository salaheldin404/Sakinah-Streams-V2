import { requireUser } from "@/lib/oauth/auth";
import { NextResponse } from "next/server";
import { ReflectionService } from "@/lib/ai/reflection/service";
import { ReflectionRequestSchema } from "@/lib/ai/schemas";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

function isUnauthorizedError(error: unknown): boolean {
  return error instanceof Error && error.message === "Unauthorized";
}

export async function POST(request: Request) {
  const t = await getTranslations("reflection");

  try {
    const user = await requireUser();
    const userId = user.id;
    const userType = "authenticated";

    const identifier = userId;

    const body = await request.json();
    const validatedData = ReflectionRequestSchema.parse(body);
    const result = await ReflectionService.generate(
      validatedData,
      userId,
      identifier,
      userType,
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith("AI_LIMIT:")) {
      const reason = error.message.split(":")[1] as Parameters<typeof t>[0];
      return NextResponse.json(
        {
          error: t(reason),
          code: reason,
        },
        { status: 429 },
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 },
      );
    }

    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      {
        error:
          "We're experiencing difficulty connecting with the reflection service. Please try again in a moment.",
      },
      { status: 500 },
    );
  }
}

/**
 * Fetch reflection history for the authenticated user.
 */
export async function GET() {
  try {
    const user = await requireUser();
    const userId = user.id;

    const logs = await prisma.emotionLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 12,
    });
    
    return NextResponse.json(logs);
  } catch (error: unknown) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Unable to retrieve your reflection history." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "Missing reflection ID" },
        { status: 400 },
      );
    }
    await prisma.emotionLog.delete({
      where: {
        id,
        userId: user.id,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Unable to delete the reflection entry." },
      { status: 500 },
    );
  }
}
