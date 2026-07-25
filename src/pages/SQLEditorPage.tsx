import React, { useEffect } from "react";
import { SQLEditor } from "../components/charts/SQLEditor";
import { connectionsApi } from "../lib/api";
import { useAppStore } from "../store/appStore";

export const SQLEditorPage: React.FC = () => {
  const { setConnections, addToast } = useAppStore();

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await connectionsApi.getAll();
        setConnections(response.data.connections);
      } catch (error) {
        addToast("error", "Failed to fetch connections");
      }
    };

    fetchConnections();
  }, [setConnections, addToast]);

  const handleSaveQuery = async (_query: string, _name: string) => {
    // This would be implemented to save the query
    addToast("info", "Query saving will be available in the Charts section");
  };

  return (
    <div className="h-full">
      <SQLEditor onSave={handleSaveQuery} />
    </div>
  );
};
