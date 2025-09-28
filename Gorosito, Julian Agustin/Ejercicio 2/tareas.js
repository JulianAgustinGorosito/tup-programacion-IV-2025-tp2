import express from "express";
import { db } from "./db.js";
import { validarId, verificarValidaciones } from "./validaciones.js";
import { query, body } from "express-validator";

const router = express.Router();

const validarFiltros = [
  query("completada").optional().isBoolean(),
];

const validarTarea = [
  body("nombre").isAlpha("es-ES", { ignore: " " }).isLength({ max: 100 }),
  body("completada").optional().isBoolean(),
];

router.get("/", validarFiltros, verificarValidaciones, async (req, res) => {
  const filtros = [];
  const valores = [];

  if (req.query.completada !== undefined) {
    const valor = req.query.completada === "true" ? 1 : 0;
    filtros.push("completada = ?");
    valores.push(valor);
  }

  let sql = "SELECT id, nombre, completada FROM tareas";
  if (filtros.length > 0) {
    sql += " WHERE " + filtros.join(" AND ");
  }
  sql += " ORDER BY nombre";

  const [rows] = await db.execute(sql, valores);
  res.json({ success: true, data: rows });
});

router.get("/:id", validarId, verificarValidaciones, async (req, res) => {
  const id = Number(req.params.id);

  const [rows] = await db.execute("SELECT * FROM tareas WHERE id=?", [id]);
  if (rows.length === 0) {
    return res.status(404).json({ success: false, message: "taarea no encontrada" });
  }

  res.json({ success: true, data: rows[0] });
});

router.post("/", validarTarea, verificarValidaciones, async (req, res) => {
  const { nombre } = req.body;
  const completada =
    req.body.completada !== undefined && req.body.completada === true ? 1 : 0;

  const [dup] = await db.execute("SELECT 1 FROM tareas WHERE nombre=?", [nombre]);
  if (dup.length > 0) {
    return res.status(409).json({ success: false, message: "ya existe esa tarea" });
  }

  const [result] = await db.execute(
    "INSERT INTO tareas (nombre, completada) VALUES (?, ?)",
    [nombre, completada]
  );

  res.status(201).json({
    success: true,
    data: { id: result.insertId, nombre, completada: !!completada },
  });
});

router.put("/:id", validarId, validarTarea, verificarValidaciones, async (req, res) => {
  const id = Number(req.params.id);
  const { nombre } = req.body;
  const completada =
    req.body.completada !== undefined && req.body.completada === true ? 1 : 0;

  const [existe] = await db.execute("SELECT id FROM tareas WHERE id=?", [id]);
  if (existe.length === 0) {
    return res.status(404).json({ success: false, message: "tarea no encontrada" });
  }

  const [dup] = await db.execute(
    "SELECT 1 FROM tareas WHERE nombre=? AND id<>?",
    [nombre, id]
  );
  if (dup.length > 0) {
    return res.status(409).json({ success: false, message: "ya existe esa tarea" });
  }

  await db.execute("UPDATE tareas SET nombre=?, completada=? WHERE id=?", [
    nombre, completada, id,
  ]);

  res.json({ success: true, data: { id, nombre, completada: !!completada } });
});

router.delete("/:id", validarId, verificarValidaciones, async (req, res) => {
  const id = Number(req.params.id);
  await db.execute("DELETE FROM tareas WHERE id=?", [id]);
  res.json({ success: true, data: id });
});

export default router;
