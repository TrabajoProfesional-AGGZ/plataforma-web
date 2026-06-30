import { useState } from 'react';

export function useListState() {
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  return { resultado, setResultado, loading, setLoading, error, setError };
}
