import { ReactNode } from 'react';
export default function TemplateEditor(props: {
    type?: string;
    title?: string;
    monacoEditor?: React.ReactNode;
    controlData: any[];
    wizardClassName?: string;
    template: any;
    logging?: boolean;
    portals?: {
        editBtn: string;
        createBtn: string;
        cancelBtn: string;    
    };
    fetchControl?: {
            isLoaded: boolean;
            fetchData: { requestedUIDs: any[] };
        } | null ;
    createControl?: {
        createResource: (resourceJSON: { createResources: any[] }, noRedirect: boolean) => void;
        cancelCreate: () => void;
        pauseCreate: () => void;
        creationStatus?: string;
        creationMsg?: any[] | null | undefined;
    };
    i18n?: (key: string, arg: any) => string;
    onControlInitialize?: (control: any) => void
    onControlChange?: (control: any) => void
    editorReadOnly?: boolean
    onStepChange?: (step: any, prevStep: any) => void;
    controlProps?: any;
}): JSX.Element;
