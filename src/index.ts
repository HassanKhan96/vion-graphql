import { config } from "dotenv";
config();
import express, { Request } from "express";
import http from "http";
import createGraphQLServer from "./graphql";
import { handleError } from "./middlewares/handleError";
import authRoutes from "./routes/authRoutes";
import { authContext } from "./helpers/auth.helper";
import { expressMiddleware } from "@as-integrations/express5";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 4000;

const httpServer = http.createServer(app);

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.status(200).send("OK");
});

app.use("/api/auth", authRoutes);

const apolloServer = createGraphQLServer(httpServer);
apolloServer.start().then(() => {
  app.use(
    "/graphql",
    expressMiddleware(apolloServer, {
      context: async ({ req }: { req: Request }) => authContext(req),
    }),
  );

  app.use(handleError);

  httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/api`);
    console.log(`GraphQL endpoint at http://localhost:${PORT}/graphql`);
  });
});
