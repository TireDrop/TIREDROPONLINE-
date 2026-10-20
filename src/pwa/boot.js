// Loaded by index.html as a second module script, so Vite folds it into the
// same entry chunk as src/main.jsx. It is separate from main.jsx because that
// file belongs to the app shell; this one only starts the PWA plumbing.
import { startPwa } from "./register.js";

startPwa();
