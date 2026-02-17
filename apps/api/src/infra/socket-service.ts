import { Server } from "socket.io";

/**
 * 🔌 Socket Service
 *
 * Manages real-time WebSocket connections for instant UI updates.
 * Used to notify the checkout frontend when a payment is detected or confirmed.
 */
export class SocketService {
  private static io: Server | null = null;

  /**
   * Initializes the Socket.io server and attaches it to the Fastify instance.
   */
  public static init(server: any) {
    this.io = new Server(server, {
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
    data: any = {},
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
}
