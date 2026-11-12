import Dexie, { type Table } from "dexie";

export type Project = {
  id: string;
  name: string;
  width: number;
  height: number;
  updatedAt: number;
  preview?: string;
  canvasJson: string;
};

class AraishiDatabase extends Dexie {
  projects!: Table<Project, string>;
  constructor() {
    super("AraishiCanvasDB");
    this.version(1).stores({ projects: "id, name, updatedAt" });
  }
}
export const db = new AraishiDatabase();
