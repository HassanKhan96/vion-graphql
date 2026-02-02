import { loadFilesSync } from "@graphql-tools/load-files";
import path from "path";

export const typeDefs = loadFilesSync(path.join(__dirname, "./*.graphql"));
