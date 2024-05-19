import { Hono } from "hono";
import { streamText } from "hono/streaming";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { z } from "zod";

const app = new Hono();
let users = [];

// Validation schema for user input
const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

app.get("/", (c) => {
  return c.html("<h1>Welcome to Auth</h1>");
});

// Sign-Up
app.post("/sign-up", async (c) => {
  try {
    const { email, password } = userSchema.parse(await c.req.json());

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      email,
      password: hashedPassword,
    };

    users.push(newUser);
    return c.json(newUser);
  } catch (error) {
    return c.json({ message: "Invalid input", error: error.message }, 400);
  }
});

// Sign-in
app.post("/sign-in", async (c) => {
  try {
    const { email, password } = userSchema
      .pick({ email: true, password: true })
      .parse(await c.req.json());

    const user = users.find((user) => user.email === email);
    if (!user) {
      return c.json({ message: "Invalid email or password" }, 401);
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return c.json({ message: "Invalid email or password" }, 401);
    }

    return c.json({ message: "Sign-in successful", user });
  } catch (error) {
    return c.json({ message: "Invalid input", error: error.message }, 400);
  }
});

// Read by ID
app.get("/user/:id", (c) => {
  const { id } = c.req.param();
  const user = users.find((user) => user.id === id);
  if (!user) {
    return c.json({ message: "User not found" }, 404);
  }
  return c.json(user);
});

// Delete single user
app.delete("/user/:id", (c) => {
  const { id } = c.req.param();
  users = users.filter((user) => user.id !== id);
  return c.json({ message: "User deleted" });
});

// Delete all users
app.delete("/users", (c) => {
  users = [];
  return c.json({ message: "All users deleted" });
});

// Reset password
app.put("/user/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const index = users.findIndex((user) => user.id === id);
    if (index === -1) {
      return c.json({ message: "User not found" }, 404);
    }

    const { password } = userSchema
      .pick({ password: true })
      .parse(await c.req.json());
    const hashedPassword = await bcrypt.hash(password, 10);

    users[index] = { ...users[index], password: hashedPassword };
    return c.json(users[index]);
  } catch (error) {
    return c.json({ message: "Invalid input", error: error.message }, 400);
  }
});

// Read all data
app.get("/users", (c) => {
  return streamText(c, async (stream) => {
    for (const newUser of users) {
      await stream.writeln(JSON.stringify(newUser));
      await stream.sleep(1000);
    }
  });
});

export default app;
