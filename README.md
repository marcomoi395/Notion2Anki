
# Notion2Anki

**Notion2Anki** is a Node.js tool designed to automate the process of fetching data from Notion, converting it into multiple-choice questions, and syncing it with Anki—a powerful application for efficient memorization. This tool is particularly useful for students and professionals who frequently use both Notion and Anki to manage and study information.

## Features

-   **Fetch Data from Notion**: Automatically retrieve items from Notion (specific pages, databases, or blocks).
-   **Convert to Multiple-Choice Questions**: Analyze and generate multiple-choice questions from the content of the items in Notion.
-   **Sync with Anki**: Connect and sync the created questions into Anki decks, making it easy to study with Anki.

## System Requirements

-   **Node.js** version 14 or higher.
-   **Notion account** with API access to the pages or databases you need to access.
-   **AnkiConnect**: An Anki plugin that allows for HTTP requests, enabling your tool to communicate with Anki.

## Installation

1.  Clone the repository:
    ```
    git clone https://github.com/username/Notion2Anki.git
    cd Notion2Anki
    ```
    
2.  Install the dependencies:
	```
	npm install
	```
4.  Configure API and connections:
    -   **Notion**: Obtain an API token from Notion Developers and place it in the `.env` file.
    -   **Anki**: Install the AnkiConnect plugin (search for and install it from Anki Add-ons).
5.  Configure the `.env` file: Create a `.env` file with the following content:
	```
	NOTION_API_KEY=
	NOTION_DATABASE_ID=
	```
## Usage

1.  **Run the tool**:
    ```
    node index.js
    ```
2.  **Create questions and sync**: The program will automatically fetch data from Notion, create multiple-choice questions, and add them to the specified Anki deck.
    
3.  **Check Anki**: Open Anki to see the synced deck, where the new questions will be ready for study.
