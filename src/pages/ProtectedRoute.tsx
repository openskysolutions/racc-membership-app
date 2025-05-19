//Add Home page component
import React from 'react';

const ProtectedRoutePage: React.FC = () => {
  return (
    <section className="container py-20">
      <h1 className="text-3xl font-bold">Protected Route</h1>
      {/* Protected content here */}
    </section>
  );
};

export default ProtectedRoutePage;