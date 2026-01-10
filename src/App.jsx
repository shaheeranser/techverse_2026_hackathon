import Index from "./components/Index.jsx";
import { Outlet } from "react-router-dom";

const App = () => {
  return (
    <Index>
      <Outlet />
    </Index>
  );
}

export default App;
