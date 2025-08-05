import express from 'express';
import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import dotenv from 'dotenv';
import cors from 'cors';


const app=express();
dotenv.config();

app.use(cors({
   origin: 'http://localhost:5173' ,
   credentials: true
}));

//helps read json data
app.use(express.json());
app.use('/api/auth', authRoutes); //prefix all routes
app.use('/api/user', userRoutes); //prefix all routes

export default app;
