const u = { plate: null };
try {
    const result = u.plate?.toLowerCase().includes("a");
    console.log("No crash, result:", result);
} catch (e) {
    console.error("Crash:", e.message);
}
