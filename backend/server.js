import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv'; 
import cookieParser from 'cookie-parser';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import connectDB from './config/db.js';
import educatorRouter from './routes/educator.routes.js';
import authRouter from './routes/auth.routes.js';
import studentRouter from './routes/student.routes.js';
import adminRouter from './routes/admin.routes.js';
import coursesRouter from './routes/courses.routes.js';
import reviewRouter from './routes/reviews.routes.js';
import moodEntryRouter from './routes/moodEntry.routes.js';
import aiRouter from './routes/ai.routes.js';
import discoussionRoutes from './routes/discussionRoutes.js';

dotenv.config();
const port = process.env.PORT || 5000;

connectDB();

const app = express();

 //Cross-Origin Resource Sharing
 const allowedOrigins = [
   'http://localhost:5173',
   process.env.FRONTEND_URL,
 ].filter(Boolean);

 app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }));

 app.use(express.json());
 app.use(express.urlencoded({extended: true})); 

 app.use(cookieParser());
 
 app.use('/api/auth', authRouter);
 app.use('/api/admin', adminRouter);
 app.use('/api/student', studentRouter);
 app.use("/api/educator", educatorRouter);
 app.use("/api/courses", coursesRouter);
 app.use("/api/reviews", reviewRouter); 
app.use("/api/moods", moodEntryRouter); 
app.use("/api/ai", aiRouter); 
app.use("/api/discussions", discoussionRoutes); 


app.use(notFound);
app.use(errorHandler);

app.listen(port, () => console.log(`Server started on port ${port}`));
