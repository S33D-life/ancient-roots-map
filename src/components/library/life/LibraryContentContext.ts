import { createContext, useContext } from "react";
import { REPOSITORY_CONTENT, type LibraryContentSource } from "@/data/library/content";

/** The editorial content seam. Defaults to the repository fixture; tests and a future adapter swap it. */
export const LibraryContentContext = createContext<LibraryContentSource>(REPOSITORY_CONTENT);
export const useLibraryContent = () => useContext(LibraryContentContext);
