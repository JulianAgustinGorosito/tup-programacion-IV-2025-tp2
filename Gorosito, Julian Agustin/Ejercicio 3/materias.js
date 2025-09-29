import express from "express";
import { db } from "./db.js";
import { validarId, verificarValidaciones } from "./validaciones.js";
import { body } from "express-validator";

const router = express.Router();

const validarMateria = [
  body("nombre").trim().isAlpha("es-ES", { ignore: " " }).isLength({ max: 50 }),
];

router.get("/", async (req, res) => {
  const [rows] = await db.execute("SELECT * FROM materias ORDER BY nombre");
  res.json({ success: true, data: rows });
});

router.get("/:id", validarId, verificarValidaciones, async (req, res) => {
  const id = Number(req.params.id);
  const [rows] = await db.execute("SELECT * FROM materias WHERE id=?", [id]);
  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: "la materia no existe" });
  }
  res.json({ success: true, data: rows[0] });
});

router.post("/", validarMateria, verificarValidaciones, async (req, res) => {
  const { nombre } = req.body;
  const nombreNorm = nombre.trim();

  const [result] = await db.execute("INSERT INTO materias (nombre) VALUES (?)", [nombreNorm]);
  res.status(201).json({ success: true, data: { id: result.insertId, nombre: nombreNorm } });
});

router.put("/:id", validarId, validarMateria, verificarValidaciones, async (req, res) => {
  const id = Number(req.params.id);
  const { nombre } = req.body;
  const nombreNorm = nombre.trim();

  await db.execute("UPDATE materias SET nombre=? WHERE id=?", [nombreNorm, id]);
  res.json({ success: true, data: { id, nombre: nombreNorm } });
});

router.delete("/:id", validarId, verificarValidaciones, async (req, res) => {
  const id = Number(req.params.id);
  await db.execute("DELETE FROM materias WHERE id=?", [id]);
  res.json({ success: true, data: id });
});

router.get("/:id/alumnos", validarId, verificarValidaciones, async (req, res) => {
  const id = Number(req.params.id);
  const sql =
    "SELECT a.id, a.nombre, a.nota1, a.nota2, a.nota3 " +
    "FROM alumnos a WHERE a.materia_id = ? ORDER BY a.nombre";
  const [rows] = await db.execute(sql, [id]);
  res.json({ success: true, data: rows });
});

export default router;
