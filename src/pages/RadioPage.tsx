import { Navigate } from "react-router-dom";

// Radio is now a room within the HeARTwood Library
const RadioPage = () => <Navigate to="/library?room=music" replace />;

export default RadioPage;
