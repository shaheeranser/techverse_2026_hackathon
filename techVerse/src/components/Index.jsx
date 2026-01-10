import Navbar from "./Navbar.jsx";

const Index = ({ children }) => {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export default Index;
