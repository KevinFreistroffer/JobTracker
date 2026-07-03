import { readFileSync } from "fs";
import path from "path";

const RESUME_FILENAME = "Kevin Freistroffer.txt";

export function getResumePath() {
  return path.join(process.cwd(), "src", "resume", RESUME_FILENAME);
}

export function getResumeText() {
  return readFileSync(getResumePath(), "utf-8");
}
