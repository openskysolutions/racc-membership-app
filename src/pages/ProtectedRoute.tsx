//Add Home page component
import React from 'react';

const ProtectedRoutePage: React.FC = () => {
  return (
    <section className="container py-20">
      <h1 className="text-3xl font-bold">Protected Route</h1>
      <p className="mt-4 text-lg">
        This is an example of a protected route. You must be logged in to view these pages.
      </p>
    </section>
  );
};

export default ProtectedRoutePage;