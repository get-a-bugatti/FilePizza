import "./config/env.js";
import { app } from "./app.js";
import http from "http";


let httpServer = null;

const startServer = () => {
  
  try {
    
    httpServer = http.createServer(app);
    const port = process.env.PORT || 3000;

    httpServer.listen(port, () => {
      console.log("✅ Server started on port", port);
    });

    httpServer.on("error", (err) => {
      console.error(`❌ Server error: ${err}`);

      process.exit(1);
    })
  } catch (startupError) {
    console.error("Startup Error: ", startupError);
  }

};

const gracefulShutdown = async () => {
  try {

    // Close Http server
    httpServer.close(() => {
      console.log("✅ HTTP Server closed.");
      process.exit(1);
    });

    
  } catch (error) {
    console.error("Error during graceful shutdown", error.message);
  }
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);


process.on("uncaughtException", (error) => {
    console.error(`Caught exception: ${error}\n` + `Exception origin: ${error.stack}`);

    gracefulShutdown();
})

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);

  gracefulShutdown();
});

startServer();