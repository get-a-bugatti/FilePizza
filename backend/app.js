import express from 'express';
import{ router as filesRouter} from './routes/file.routes.js';



const app = express();

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({limit: "16kb"}));


app.use("/api/v1/files", filesRouter);

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status ?? err.statusCode ?? 500;
  if (status >= 500) console.error(err);

  res.status(status).json({ 
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === "development" && {stack: err.stack})
   });
});

// No app.listen here: index.js is the entrypoint (package.json start/dev) and
// creates the server itself — listening in both places opened a second server on
// port 3000 (also `intFromEnv(PORT, 3000)` passed a number instead of "PORT", so
// it always fell back to 3000 regardless of .env).


export {app};