## Features

This project provides a file picker interface for managing and indexing resources from various connections into knowledge bases. Key features include:

-   **Authentication**: Secure user login and logout.
-   **File Browsing**: Navigate through connected file systems, listing files and folders.
-   **Resource Indexing**: Toggle individual files or entire folders (recursively) for indexing into a selected knowledge base.
-   **Global Search**: Search for resources across all directories.
-   **Filtering & Sorting**: Filter and sort resources by status, type, and name.
-   **Multi-Connection Support**: Connect to different data sources (e.g., Google Drive).
-   **Real-time Indexing Status**: Monitor the indexing progress of resources.
-   **Constant everything**: Every key/static value is in a constant file

## Installation

To set up and run this project locally, follow these steps:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/vaccarov/FilePicker.git
    cd FilePicker
    npm install
    ```

3.  **Set up environment variables**:
    Create a `.env.local` file in the root of the project and add the following environment variables.

    ```
    NEXT_PUBLIC_SUPABASE_URL=https://sb.stack-ai.com
    NEXT_PUBLIC_BACKEND_URL=https://api.stack-ai.com
    NEXT_PUBLIC_EMAIL=stackaitest@gmail.com
    NEXT_PUBLIC_SUPABASE_ANON_KEY=
    # Not required, for login autocomplete
    NEXT_PUBLIC_PASSWORD=
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Help

If you encounter any issues or have questions, email victorvaccaro93@gmail.com or open an issue on this repository.

## Steps

1. ~~Create git repo & init project~~
2. ~~Handle authentication & Create login page~~
3. Handle API calls (pending because of 500, using localstorage)
    1. ~~Get user connections~~
    2. ~~Get ressources for the selected connection~~
4. ~~Show files/folder in readonly and implement shadcn components~~
5. ~~Handle folder indexation (recursive indexation)~~
6. ~~Handle file indexation with Tanstack query~~
7. ~~Add UI elements (error handling, skeleton…)~~
8. ~~Add bonus points (sorting/filtering/searching)~~
9. ~~Fill readme~~
10. Upload project’s video screen on Vercel

### Improvements

1. Better storage than localStorage
2. Add translation
3. Implement multi Knowledge bases support
4. ~~Use Tanstack Table for sortering/filtering/searching~~
5. Use icons library instead of emojis
6. ~~Add information message on sync~~
7. ~~Lint~~
8. Online/offline mode (localstorage/real data)
9. Improve login/logout UI
10. Pagination


### Notes

Instead of "batches" of indexation, I've took the choice to make indexation independant per file/folder, this way we can bypass the duplication of indexed files (folder+file inside). To implement batches of indexation, I would need to know how the backend handle the folder indexation.

In order for the real API calls to work, 2 assertions must be true:

1. Every resource must have a parent_id field in order to keep the logic of building the folder architecture
2. Fetching resources don't take pagination into consideration. If there a "limit" parameter, we can bypass it by providing a big number for now.

Functions parameters needs to be updated if we would go with the StackAI API instead of localstorage. For lint purposes, I've removed unecessary attributes.
It's possible to make a offline/online mode that switches from localstorage to API data.