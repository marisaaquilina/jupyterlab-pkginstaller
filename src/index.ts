import {
  JupyterFrontEnd, JupyterFrontEndPlugin, ILabShell
} from '@jupyterlab/application';

import { ICommandPalette, IClientSession } from '@jupyterlab/apputils';

import {
  ISearchProviderRegistry,
  SearchProviderRegistry,
  CodeMirrorSearchProvider,
  NotebookSearchProvider
} from '@jupyterlab/documentsearch';

import {
  ConsolePanel,
  IConsoleTracker
} from '@jupyterlab/console';

import {
  IStatusBar,
  KernelStatus
} from '@jupyterlab/statusbar';

import { SearchInstance } from './SearchInstance';

import { IMainMenu } from '@jupyterlab/mainmenu';
import { Title, Widget } from '@phosphor/widgets';

///Experiments above

import {
  INotebookTools, INotebookTracker, NotebookPanel, 
} from '@jupyterlab/notebook';

import PackageTool from './PackageTool';

import '../style/index.css';

//Expriments
//const SEARCHABLE_CLASS = 'jp-mod-searchable';

/**
 * Initialization data for the pkginstaller extension.
 */
const pkginstaller: JupyterFrontEndPlugin<void> = {
  id: 'pkginstaller',
  autoStart: true,
  requires: [INotebookTools, INotebookTracker],
  activate: (app: JupyterFrontEnd, cellTools: INotebookTools, notebookTracker: INotebookTracker, panel: NotebookPanel) => {  
    const packageTool = new PackageTool(app, notebookTracker, panel);
    cellTools.addItem({ tool: packageTool });
    console.log(':-))))');
  }
};

/**
 * Experimnents
 */
// const labShellWidgetListener: JupyterFrontEndPlugin<void> = {
//   id: 'labShellWidgetListener1',
//   requires: [ILabShell, ISearchProviderRegistry],
//   autoStart: true,
//   activate: (
//     app: JupyterFrontEnd,
//     labShell: ILabShell,
//     registry: ISearchProviderRegistry
//   ) => {
//     // If a given widget is searchable, apply the searchable class.
//     // If it's not searchable, remove the class.
//     const transformWidgetSearchability = (widget: Widget) => {
//       if (!widget) {
//         return;
//       }
//       const providerForWidget = registry.getProviderForWidget(widget);
//       if (providerForWidget) {
//         widget.addClass(SEARCHABLE_CLASS);
//       }
//       if (!providerForWidget) {
//         widget.removeClass(SEARCHABLE_CLASS);
//       }
//     };

//     // Update searchability of the active widget when the registry
//     // changes, in case a provider for the current widget was added
//     // or removed
//     registry.changed.connect(() =>
//       transformWidgetSearchability(labShell.activeWidget)
//     );

//     // Apply the searchable class only to the active widget if it is actually
//     // searchable. Remove the searchable class from a widget when it's
//     // no longer active.
//     labShell.activeChanged.connect((_, args) => {
//       const oldWidget = args.oldValue;
//       if (oldWidget) {
//         oldWidget.removeClass(SEARCHABLE_CLASS);
//       }
//       transformWidgetSearchability(args.newValue);
//     });
//   }
// };

const extension: JupyterFrontEndPlugin<ISearchProviderRegistry> = {
  id: 'extension1',
  provides: ISearchProviderRegistry,
  optional: [ICommandPalette, IMainMenu],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    mainMenu: IMainMenu | null
  ) => {
    // Create registry, retrieve all default providers
    const registry: SearchProviderRegistry = new SearchProviderRegistry();

    // Register default implementations of the Notebook and CodeMirror search providers
    registry.register('jp-notebookSearchProvider', NotebookSearchProvider);
    registry.register('jp-codeMirrorSearchProvider', CodeMirrorSearchProvider);

    const activeSearches = new Map<string, SearchInstance>();

    const startCommand: string = 'documentsearch:start';
    const nextCommand: string = 'documentsearch:highlightNext';
    const prevCommand: string = 'documentsearch:highlightPrevious';
    app.commands.addCommand(startCommand, {
      label: 'Find…',
      isEnabled: () => {
        const currentWidget = app.shell.currentWidget;
        if (!currentWidget) {
          return;
        }
        return registry.getProviderForWidget(currentWidget) !== undefined;
      },
      execute: () => {
        const currentWidget = app.shell.currentWidget;
        if (!currentWidget) {
          return;
        }
        const widgetId = currentWidget.id;
        let searchInstance = activeSearches.get(widgetId);
        if (!searchInstance) {
          const searchProvider = registry.getProviderForWidget(currentWidget);
          if (!searchProvider) {
            return;
          }
          searchInstance = new SearchInstance(currentWidget, searchProvider);

          activeSearches.set(widgetId, searchInstance);
          // find next and previous are now enabled
          app.commands.notifyCommandChanged();

          searchInstance.disposed.connect(() => {
            activeSearches.delete(widgetId);
            // find next and previous are now not enabled
            app.commands.notifyCommandChanged();
          });
        }
        searchInstance.focusInput();
      }
    });

    // Add the command to the palette.
    if (palette) {
      palette.addItem({ command: startCommand, category: 'Main Area' });
      palette.addItem({ command: nextCommand, category: 'Main Area' });
      palette.addItem({ command: prevCommand, category: 'Main Area' });
    }
    // Add main menu notebook menu.
    if (mainMenu) {
      mainMenu.editMenu.addGroup(
        [
          { command: startCommand },
          { command: nextCommand },
          { command: prevCommand }
        ],
        10
      );
    }

    // Provide the registry to the system.
    return registry;
  }
};

/**
 * A plugin that provides a kernel status item to the status bar.
 */
export const kernelStatus: JupyterFrontEndPlugin<void> = {
  id: 'randyykernel',
  autoStart: true,
  requires: [IStatusBar, INotebookTracker, IConsoleTracker, ILabShell],
  activate: (
    app: JupyterFrontEnd,
    statusBar: IStatusBar,
    notebookTracker: INotebookTracker,
    consoleTracker: IConsoleTracker,
    labShell: ILabShell
  ) => {
    // When the status item is clicked, launch the kernel
    // selection dialog for the current session.
    let currentSession: IClientSession | null = null;
    const changeKernel = async () => {
      if (!currentSession) {
        return;
      }
      await currentSession.selectKernel();
    };

    // Create the status item.
    const item = new KernelStatus({
      onClick: changeKernel
    });

    // When the title of the active widget changes, update the label
    // of the hover text.
    const onTitleChanged = (title: Title<Widget>) => {
      item.model!.activityName = title.label;
    };

    // Keep the session object on the status item up-to-date.
    labShell.currentChanged.connect((_, change) => {
      const { oldValue, newValue } = change;

      // Clean up after the old value if it exists,
      // listen for changes to the title of the activity
      if (oldValue) {
        oldValue.title.changed.disconnect(onTitleChanged);
      }
      if (newValue) {
        newValue.title.changed.connect(onTitleChanged);
      }

      // Grab the session off of the current widget, if it exists.
      if (newValue && consoleTracker.has(newValue)) {
        currentSession = (newValue as ConsolePanel).session;
      } else if (newValue && notebookTracker.has(newValue)) {
        currentSession = (newValue as NotebookPanel).session;
      } else {
        currentSession = null;
      }
      item.model!.session = currentSession;
    });

    // statusBar.registerStatusItem(
    //   'statusyy',
    //   {
    //     item,
    //     align: 'left',
    //     rank: 1,
    //     isActive: () => {
    //       const current = labShell.currentWidget;
    //       return (
    //         current &&
    //         (notebookTracker.has(current) || consoleTracker.has(current))
    //       );
    //     }
    //   }
    // );
  }
};



export default [
  pkginstaller, extension, kernelStatus
];