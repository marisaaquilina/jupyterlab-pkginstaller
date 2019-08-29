import { NotebookTools, INotebookTracker } from '@jupyterlab/notebook';

import { PanelLayout } from '@phosphor/widgets';

import { Message } from '@phosphor/messaging';

import { JupyterFrontEnd } from '@jupyterlab/application';

//import { PackageSearcher } from './PackageBar';

//import { ReactWidget } from '@jupyterlab/apputils';

//import * as React from 'react';
import { KernelSpyModel } from './model';

import { MessageLogView } from './widget';
import { Kernel } from '@jupyterlab/services';

class PackageTool extends NotebookTools.Tool {
  readonly app: JupyterFrontEnd;
  constructor(app: JupyterFrontEnd, notebookTracker: INotebookTracker) {
    super();
    this.app = app;
    this.notebookTracker = notebookTracker;
    this.layout = new PanelLayout();
  } 
  protected onAfterAttach(msg: Message): void {
    this.notebookTracker.currentWidget.session.ready.then(() => {
      let layout = this.layout as PanelLayout;
      let count = layout.widgets.length;
      for (let i = 0; i < count; i++) {
        layout.widgets[0].dispose();
      }
      let session = this.notebookTracker.currentWidget.session
      //const widget = new KernelSpyView(session.kernel! as Kernel.IKernel);
      //layout.addWidget(widget);
      //console.log('MessageLog', widget.messageLog);
      let model = new KernelSpyModel(session.kernel! as Kernel.IKernel);
      const view = new MessageLogView(model, session.kernel.id, session.kernelDisplayName);
      layout.addWidget(view);
      // const cellWidget = ReactWidget.create(<PackageSearcher kernelId={session.kernel.id} kernelName={session.kernelDisplayName} uninstalledPackage={''}/>);
      // layout.addWidget(cellWidget);
    });
  }
  protected onActiveCellChanged(msg: Message): void {
    if (this.notebookTracker.currentWidget && this.notebookTracker.currentWidget.session) {
      this.notebookTracker.currentWidget.session.ready.then(() => {
        let layout = this.layout as PanelLayout;
        let count = layout.widgets.length;
        for (let i = 0; i < count; i++) {
          layout.widgets[0].dispose();
        }
        let session = this.notebookTracker.currentWidget.session;
        
        let model = new KernelSpyModel(session.kernel! as Kernel.IKernel);
        const phosWid = new MessageLogView(model, session.kernel.id, session.kernelDisplayName);
        layout.addWidget(phosWid);
        //console.log(view.node);
        // const cellWidget = ReactWidget.create(<PackageSearcher kernelId={session.kernel.id} kernelName={session.kernelDisplayName} uninstalledPackage={Math.random().toString(36).substring(7)}/>);
        // layout.addWidget(cellWidget);
        // ReactDOM.render(
        //   <TagsToolComponent
        //     widget={widget}
        //     tagsList={tagsList}
        //     allTagsList={allTagsList}
        //   />,
        //   widget.node
        // );
      });
    }
  }
  
  private notebookTracker:INotebookTracker;
}

export default PackageTool;