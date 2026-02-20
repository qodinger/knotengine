import { Server as SocketIOServer } from "socket.io";
import * as http from "http";
import * as https from "https";

/**
 * 🔌 Socket Service
 *
 * Manages real-time WebSocket connections for instant UI updates.
 * Used to notify the checkout frontend when a payment is detected or confirmed.
 */
export class SocketService {
  private static io: SocketIOServer | null = null;

  /**
   * Initializes the Socket.io server and attaches it to the HTTP server.
   */
  public static init(server: http.Server | https.Server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.io.on("connection", (socket) => {
      console.log(`🔌 New socket connection: ${socket.id}`);

      // Allow clients to join a specific invoice room
      socket.on("join_invoice", (invoiceId: string) => {
        console.log(`👥 Socket ${socket.id} joined invoice room: ${invoiceId}`);
        socket.join(invoiceId);
      });

      socket.on("join_merchant", (merchantId: string) => {
        console.log(
          `👥 Socket ${socket.id} joined merchant room: ${merchantId}`,
        );
        socket.join(merchantId);
      });

      socket.on("disconnect", () => {
        console.log(`🔌 Socket disconnected: ${socket.id}`);
      });
    });

    return this.io;
  }

  /**
   * Emits a status update to all clients in a specific invoice room.
   */
  public static emitStatusUpdate(
    invoiceId: string,
    status: string,
    data: Record<string, unknown> = {},
  ) {
    if (!this.io) {
      console.warn(
        "⚠️ SocketService not initialized. Cannot emit status update.",
      );
      return;
    }

    console.log(`📢 Emitting '${status}' for invoice: ${invoiceId}`);
    this.io.to(invoiceId).emit("status_update", {
      invoiceId,
      status,
      ...data,
    });
  }

  /**
   * Emits a generic event to all clients in a merchant's specific room.
   */
  public static emitToMerchant(
    merchantId: string,
    event: string,
    data: Record<string, unknown> = {},
  ) {
    if (!this.io) return;
    console.log(`📢 Emitting '${event}' to merchant: ${merchantId}`);
    this.io.to(merchantId.toString()).emit(event, data);
  }
}
