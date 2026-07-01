export const PAGE_TOURS: Record<string, MultiLangTourStep[]> = {
    "/home": [
        { 
            element: "#tour-header-workspace", 
            title: { en: "Navigation Bar", de: "Navigationsleiste" }, 
            intro: { 
                en: "Switch projects and boards here. Use 'View Tour Again' to replay this guide anytime.",
                de: "Wechseln Sie hier zwischen Projekten und Boards. Verwenden Sie 'Tour erneut ansehen', um diese Anleitung jederzeit zu wiederholen."
            } 
        },
        { 
            element: "#tour-home-sidebar", 
            title: { en: "Sidebar Navigation", de: "Seitenleisten-Navigation" }, 
            intro: { 
                en: "Use the left sidebar (menu on mobile) to move between Home, Dashboard, Chat, and File Manager. Each section has its own guided tour.",
                de: "Verwenden Sie die linke Seitenleiste (Menü auf dem Handy), um zwischen Startseite, Dashboard, Chat und Dateimanager zu wechseln. Jeder Bereich hat seine eigene geführte Tour."
            } 
        },
        { 
            element: "#tour-home-new-project", 
            title: { en: "Create a New Project", de: "Neues Projekt erstellen" }, 
            intro: { 
                en: "Click the '+ New Project' button or the card below to start a fresh project. Give it a name and start organizing your real estate analysis.",
                de: "Klicken Sie auf die Schaltfläche '+ Neues Projekt' oder die Karte unten, um ein neues Projekt zu starten. Geben Sie ihm einen Namen und beginnen Sie mit der Organisation Ihrer Immobilienanalyse."
            } 
        },
        { 
            element: "#tour-home-searchbar", 
            title: { en: "Search Your Projects", de: "Suchen Sie Ihre Projekte" }, 
            intro: { 
                en: "Use the search bar to quickly find projects by name. Results update instantly as you type — no need to press Enter.",
                de: "Verwenden Sie die Suchleiste, um Projekte schnell nach Namen zu finden. Die Ergebnisse werden sofort während der Eingabe aktualisiert – Sie müssen nicht die Eingabetaste drücken."
            } 
        },
        { 
            element: "#tour-home-view", 
            title: { en: "Grid & List Views", de: "Gitter- und Listenansichten" }, 
            intro: { 
                en: "Toggle between grid and list view to browse your projects in the layout that works best for you.",
                de: "Wechseln Sie zwischen Gitter- und Listenansicht, um Ihre Projekte in dem Layout zu durchsuchen, das für Sie am besten funktioniert."
            } 
        },
        { 
            element: "#tour-home-project-action", 
            title: { en: "Project Quick Actions", de: "Projekt-Schnellaktionen" }, 
            intro: { 
                en: "Click on a project card to access dashboard and quick actions or more options like rename, duplicate for a new analysis cycle, or delete it when no longer needed.",
                de: "Klicken Sie auf eine Projektkarte, um auf das Dashboard und Schnellaktionen zuzugreifen oder weitere Optionen wie Umbenennen, Duplizieren für einen neuen Analysezyklus oder Löschen, wenn es nicht mehr benötigt wird."
            } 
        },
    ],
    "/dashboard": [
        { 
            element: "#tour-dashboard-header", 
            title: { en: "Dashboard Cockpit", de: "Dashboard-Cockpit" }, 
            intro: { 
                en: "Welcome to your Dashboard! This is where you can see all your data visualizations and key performance indicators at a glance.",
                de: "Willkommen in Ihrem Dashboard! Hier sehen Sie alle Ihre Datenvisualisierungen und Leistungskennzahlen auf einen Blick."
            } 
        },
        { 
            element: "#tour-dashboard-widget-0", 
            title: { en: "Drag & Resize Widgets", de: "Widgets ziehen und Größe ändern" }, 
            intro: { 
                en: "Widgets are fully draggable and resizable. Arrange the board to match your workflow — place your most important metrics front and center.",
                de: "Widgets sind vollständig verschiebbar und in der Größe veränderbar. Ordnen Sie das Board so an, dass es Ihrem Arbeitsablauf entspricht – platzieren Sie Ihre wichtigsten Kennzahlen vorne und in der Mitte."
            } 
        },
    ],
    "/chat": [
        { 
            element: "#tour-chat-header", 
            title: { en: "AI-Powered Analysis", de: "KI-gestützte Analyse" }, 
            intro: { 
                en: "The Chat page is your workspace for AI-driven real estate research. Upload documents, ask questions, and generate structured insights — all in a conversational interface.",
                de: "Die Chat-Seite ist Ihr Arbeitsbereich für KI-gestützte Immobilienforschung. Laden Sie Dokumente hoch, stellen Sie Fragen und generieren Sie strukturierte Erkenntnisse – alles in einer dialogorientierten Oberfläche."
            } 
        },
        { 
            element: "#tour-chat-sidebar", 
            title: { en: "Chat Sessions", de: "Chat-Sitzungen" }, 
            intro: { 
                en: "The sidebar lists all your chat sessions for the current project. Switch between sessions to revisit past analyses or start a fresh conversation.",
                de: "Die Seitenleiste listet alle Ihre Chat-Sitzungen für das aktuelle Projekt auf. Wechseln Sie zwischen den Sitzungen, um vergangene Analysen erneut aufzurufen oder ein neues Gespräch zu beginnen."
            } 
        },
        { 
            element: "#tour-chat-select-ai", 
            title: { en: "Select an AI Model", de: "Wählen Sie ein KI-Modell" }, 
            intro: { 
                en: "Choose the AI model that best fits your task — from Google PaLM and GPT-4, etc. to specialized Trend Indication and Trend Ontology models.",
                de: "Wählen Sie das KI-Modell, das am besten zu Ihrer Aufgabe passt – von Google PaLM und GPT-4 usw. bis hin zu speziellen Trendindikations- und Trendontologiemodellen."
            } 
        },
        { 
            element: "#tour-chat-input", 
            title: { en: "Ask Your Question", de: "Stellen Sie Ihre Frage" }, 
            intro: { 
                en: "Type your question or insight request in the input box. You can also attach files directly here. Press Enter or click Send to get an AI-generated analysis.",
                de: "Geben Sie Ihre Frage oder Insight-Anfrage in das Eingabefeld ein. Sie können Dateien auch direkt hier anhängen. Drücken Sie die Eingabetaste oder klicken Sie auf Senden, um eine KI-generierte Analyse zu erhalten."
            } 
        },
    ],
    "/file-manager": [
        { 
            element: "#tour-fm-toolbar", 
            title: { en: "Your File Workspace", de: "Ihr Datei-Arbeitsbereich" }, 
            intro: { 
                en: "The File Manager organizes all documents uploaded to Trend Agent. Files are nested under Projects → Sessions → Analysis Modules for easy navigation.",
                de: "Der Dateimanager organisiert alle bei Trend Agent hochgeladenen Dokumente. Dateien sind unter Projekte → Sitzungen → Analysemodule verschachtelt, um die Navigation zu erleichtern."
            } 
        },
        { 
            element: "#tour-fm-projects", 
            title: { en: "Projects & Sessions", de: "Projekte & Sitzungen" }, 
            intro: { 
                en: "Browse your project folders to find files from specific analysis sessions. Click a project to see its sessions, then navigate to module-level files.",
                de: "Durchsuchen Sie Ihre Projektordner, um Dateien aus bestimmten Analysesitzungen zu finden. Klicken Sie auf ein Projekt, um seine Sitzungen zu sehen, und navigieren Sie dann zu den Dateien auf Modulebene."
            } 
        },
        { 
            element: "#tour-fm-actions", 
            title: { en: "File Actions", de: "Dateiaktionen" }, 
            intro: { 
                en: "Use the header buttons to create folders, upload new files, select multiple items for bulk actions, or filter the current view. File cards also let you download or delete individual files.",
                de: "Verwenden Sie die Schaltflächen in der Kopfzeile, um Ordner zu erstellen, neue Dateien hochzuladen, mehrere Elemente für Massenaktionen auszuwählen oder die aktuelle Ansicht zu filtern. Mit Dateikarten können Sie auch einzelne Dateien herunterladen oder löschen."
            } 
        },
    ],
}

export type MultiLangTourStep = {
  element: string;
  title: { en: string; de: string };
  intro: { en: string; de: string };
};
