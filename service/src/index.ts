// Express server and starts it listening on a specified port.
// The port is determined by the PORT environment variable, or 5000 if it is not set.
// Once the server is running, a message is logged to the console indicating the port it is listening on.
import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Export the Express app instance, allowing it to be imported and used elsewhere.
export default app;
