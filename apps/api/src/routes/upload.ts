import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { v2 as cloudinary } from "cloudinary";

const oauthHook = async (request: FastifyRequest, reply: FastifyReply) => {
  const oauthId = request.headers["x-oauth-id"] as string;
  const secret = request.headers["x-internal-secret"] as string;

  if (!oauthId || secret !== process.env.INTERNAL_SECRET) {
    return reply.code(401).send({ error: "Unauthorized" });
  }
};

export async function uploadRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // ──────────────────────────────────────────────
  // POST /v1/upload/logo — Upload merchant logo to Cloudinary
  // Accepts a base64 Data URI, uploads to Cloudinary, returns the URL
  // ──────────────────────────────────────────────
  server.post(
    "/v1/upload/logo",
    {
      preHandler: oauthHook,
      schema: {
        body: z.object({
          image: z.string().min(1), // base64 data URI e.g. "data:image/png;base64,..."
          merchantId: z.string().optional(), // used as public_id for easy management
        }),
      },
    },
    async (request, reply) => {
      const { image, merchantId } = request.body;

      // Configure Cloudinary lazily at request time (after dotenv has loaded)
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      if (!process.env.CLOUDINARY_API_SECRET) {
        return reply.code(503).send({
          error:
            "Image upload not configured. Please set CLOUDINARY_API_SECRET.",
        });
      }

      try {
        const publicId = merchantId
          ? `knotengine/logos/${merchantId}`
          : `knotengine/logos/${Date.now()}`;

        const result = await cloudinary.uploader.upload(image, {
          public_id: publicId,
          overwrite: true,
          resource_type: "image",
          // Auto-crop to square and optimize
          transformation: [
            { width: 256, height: 256, crop: "fill", gravity: "auto" },
            { fetch_format: "auto", quality: "auto" },
          ],
        });

        return reply.code(200).send({
          url: result.secure_url,
          publicId: result.public_id,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[Upload] Cloudinary upload failed:", message);
        return reply
          .code(500)
          .send({ error: "Image upload failed", details: message });
      }
    },
  );
}
