import { each } from '@phosphor/algorithm';

import { PanelLayout } from '@phosphor/widgets';

import { VDomRenderer } from '@jupyterlab/apputils';

import * as React from 'react';

import { KernelSpyModel, ThreadIterator } from './Model';

import { PackageSearcher } from './PackageBar';

import '../style/index.css';

function Message(props: any) {
  const packagefromMessage = props.message.content.evalue.split("'")[1];
  return (
    <PackageSearcher kernelId={props.kernelId} kernelName={props.kernelName} uninstalledPackage={packagefromMessage} moduleError={props.moduleError} layouty={props.layouty}/>
  );
}

export class MessageLogView extends VDomRenderer<KernelSpyModel> {
  constructor(model: KernelSpyModel, kernelId: string, kernelName: string, layouty: PanelLayout) {
    super();
    this.model = model;
    this.kernelName = kernelName;
    this.kernelId = kernelId;
    this.layouty = layouty;
  }
  protected render(): React.ReactElement<any> {
    const model = this.model!;
    let errorMessage: React.ReactElement<any>;
    let threads = new ThreadIterator(model.tree, this.collapsed);
    each(threads, ({args, hasChildren}) => {
      if (args.msg.header.msg_type=="error") {
        let count = this.layouty.widgets.length;
        if (count > 1) {
          this.layouty.widgets[count - 1].dispose();  
        }
        errorMessage = Message({ 
          message:args.msg, kernelName: this.kernelName, kernelId: this.kernelId, moduleError: true, layouty: this.layouty
        });
      }
    });
    return errorMessage;
  }
  protected collapsed: {[key: string]: boolean} = {};
  protected kernelName: string;
  protected kernelId: string;
  protected layouty: PanelLayout;
}

