// backend/server.ts
import dotenv from "dotenv";
import { server } from "./config/socket";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Remove any existing listener on the port
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Socket.IO ready for origin: ${process.env.FRONTEND_URL}`);
      console.log(`✅ Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("❌ Server startup error:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

startServer();