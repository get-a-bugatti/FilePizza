import express from 'express';
import { intFromEnv } from './config/env';
import{ router as filesRouter} from './routes/file.routes.js';



const app = express();

app.use(express.json({limit: "16kb"}));


app.use("/api/files", filesRouter);

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

const PORT = Number(process.env.PORT) || 3000;
app.listen(intFromEnv(PORT, 3000), () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
