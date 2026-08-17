import { useCallback, useEffect, useState } from "react";
import type { RestaurantStatus } from "@monitor/shared";
import { fetchRestaurants } from "./api";
import "./App.css";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; generatedAt: string; restaurants: RestaurantStatus[] };

function App() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const load = useCallback(() => {
    setState({ status: "loading" });
    fetchRestaurants()
      .then(({ generatedAt, restaurants }) => setState({ status: "ready", generatedAt, restaurants }))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        setState({ status: "error", message });
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main>
      <header>
        <h1>Restaurant availability monitor</h1>
        <button type="button" onClick={load}>
          Refresh
        </button>
      </header>

      {state.status === "loading" && <p>Loading…</p>}

      {state.status === "error" && (
        <p role="alert" className="error">
          Could not reach the backend: {state.message}
        </p>
      )}

      {state.status === "ready" && (
        <>
          <p className="generated-at">Snapshot data as of: {new Date(state.generatedAt).toLocaleString()}</p>
          <RestaurantTable restaurants={state.restaurants} />
        </>
      )}
    </main>
  );
}

function RestaurantTable({ restaurants }: { restaurants: RestaurantStatus[] }) {
  if (restaurants.length === 0) {
    return <p>No restaurants tracked yet — run the pipeline to seed data.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Chain</th>
          <th>Branch</th>
          <th>Expected</th>
          <th>Actual</th>
          <th>Last checked</th>
          <th>Listing</th>
        </tr>
      </thead>
      <tbody>
        {restaurants.map((restaurant) => (
          <tr key={restaurant.id} className={restaurant.mismatch ? "mismatch" : undefined}>
            <td>{restaurant.chain}</td>
            <td>{restaurant.branch}</td>
            <td>{formatExpected(restaurant.expectedState)}</td>
            <td>{formatActual(restaurant.actualState)}</td>
            <td>{restaurant.lastFetchedAt ? new Date(restaurant.lastFetchedAt).toLocaleString() : "never"}</td>
            <td>
              <a href={restaurant.platformUrl} target="_blank" rel="noreferrer">
                view
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function formatExpected(state: RestaurantStatus["expectedState"]): string {
  if (state === null) return "unknown";
  return state === "expected-open" ? "should be open" : "should be closed";
}

function formatActual(state: RestaurantStatus["actualState"]): string {
  if (state === null) return "no data yet";
  return state === "available" ? "available" : "unavailable";
}

export default App;

