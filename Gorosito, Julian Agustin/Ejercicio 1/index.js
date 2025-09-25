import express from "express";
import mysql from "mysql2/promise";

const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Ejercicio 1 OK");
});

app.get("/rectangulos", async (req, res) => {
    const [rows] = await db.execute("SELECT * FROM rectangulos ORDER BY id DESC");
    res.json(rows);
});

app.get("/rectangulos/:id", async (req, res) => {
    const id = Number(req.params.id);
    const [rows] = await db.execute("SELECT * FROM rectangulos WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "no encontrado" });
    res.json(rows[0]);
});

app.post("/rectangulos", async (req, res) => {
    const lado1 = Number(req.body.lado1);
    const lado2 = Number(req.body.lado2);

    if (!Number.isFinite(lado1) || !Number.isFinite(lado2)) {
        return res.status(400).json({ error: "lado1 y lado2 debe ser numericos" });
    }

    const perimetro = 2 * (lado1 + lado2);
    const superficie = lado1 * lado2;

    const [result] = await db.execute(
        "INSERT INTO rectangulos (lado1, lado2, perimetro, superficie) VALUES (?, ?, ?, ?)",
        [lado1, lado2, perimetro, superficie]
    );

    const [rows] = await db.execute("SELECT * FROM rectangulos WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
});

app.put("/rectangulos/:id", async (req, res) => {
    const id = Number(req.params.id);
    const lado1 = Number(req.body.lado1);
    const lado2 = Number(req.body.lado2);

    if (!Number.isFinite(lado1) || !Number.isFinite(lado2)) {
        return res.status(400).json({ error: "los lados deben ser numericos" });
    }

    const perimetro = 2 * (lado1 + lado2);
    const superficie = lado1 * lado2;

    const [result] = await db.execute(
        "UPDATE rectangulos SET lado1 = ?, lado2 = ?, perimetro = ?, superficie = ? WHERE id = ?",
        [lado1, lado2, perimetro, superficie, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: "no encontrado" });

    const [rows] = await db.execute("SELECT * FROM rectangulos WHERE id = ?", [id]);
    res.json(rows[0]);
});

app.delete("/rectangulos/:id", async (req, res) => {
    const id = Number(req.params.id);
    const [result] = await db.execute("DELETE FROM rectangulos WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "no encontrado" });
    res.status(204).send();
});

app.listen(port, () => {
    console.log(`servidor escuchando en http://localhost:${port}`);
});
