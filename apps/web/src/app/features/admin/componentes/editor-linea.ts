import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Editor, Node } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

/**
 * El documento admite un solo párrafo: cada bloque de la página de servicio es
 * una línea de HTML sin `<p>` alrededor, y el sitio lo pone dentro del suyo.
 * Enter no hace nada; Mayúsculas+Enter corta la línea.
 */
const DocumentoDeUnParrafo = Node.create({
  name: 'doc',
  topNode: true,
  content: 'paragraph',
});

/**
 * Editor de una línea con negrita, cursiva y enlaces, para los bloques de las
 * páginas de servicio. Es lo único que la plantilla sabe mostrar; el editor
 * completo de las novedades ofrecería cosas que acá se perderían al guardar.
 */
@Component({
  selector: 'app-editor-linea',
  standalone: true,
  template: `
    <div class="caja" [class.caja-destacada]="destacado()">
      <div class="barra" role="toolbar" [attr.aria-label]="'Formato de ' + etiqueta()">
        <button type="button" (mousedown)="$event.preventDefault()" (click)="negrita()"
                [class.activo]="activo('bold')" aria-label="Negrita"><strong>N</strong></button>
        <button type="button" (mousedown)="$event.preventDefault()" (click)="cursiva()"
                [class.activo]="activo('italic')" aria-label="Cursiva"><em>C</em></button>
        <button type="button" (mousedown)="$event.preventDefault()" (click)="abrirEnlace()"
                [class.activo]="activo('link')" aria-label="Enlace">Enlace</button>
        @if (activo('link')) {
          <button type="button" (mousedown)="$event.preventDefault()" (click)="quitarEnlace()">
            Quitar enlace
          </button>
        }
      </div>

      @if (pidiendoEnlace()) {
        <div class="enlace">
          <input #campoEnlace type="text" [value]="urlEnlace()" placeholder="/vademecum o https://…"
                 (input)="urlEnlace.set(campoEnlace.value)"
                 (keydown.enter)="$event.preventDefault(); aplicarEnlace()"
                 (keydown.escape)="pidiendoEnlace.set(false)" aria-label="Dirección del enlace" />
          <button type="button" class="aplicar" (click)="aplicarEnlace()">Aplicar</button>
          <button type="button" (click)="pidiendoEnlace.set(false)">Cancelar</button>
        </div>
      }

      <div #contenedor class="contenido" [attr.aria-label]="etiqueta()"></div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .caja {
      border: 1px solid var(--color-borde);
      border-radius: 12px;
      background: #ffffff;
      transition: border-color 0.2s;
    }

    .caja:focus-within {
      border-color: var(--color-teal);
    }

    .caja-destacada {
      background: var(--color-cielo);
    }

    .barra {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      padding: 6px;
      border-bottom: 1px solid var(--color-borde);
    }

    button {
      min-width: 34px;
      height: 30px;
      padding: 0 10px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      font: inherit;
      font-size: 14px;
      color: var(--color-tinta);
      cursor: pointer;
    }

    button:hover {
      background: var(--color-nube);
    }

    button.activo {
      background: var(--color-cielo);
      color: var(--color-teal-hondo);
    }

    .enlace {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 8px;
      border-bottom: 1px solid var(--color-borde);
    }

    .enlace input {
      flex: 1 1 220px;
      min-width: 0;
      height: 34px;
      padding: 0 10px;
      border: 1px solid var(--color-borde);
      border-radius: 8px;
      font: inherit;
      font-size: 15px;
    }

    .enlace .aplicar {
      background: var(--color-teal-hondo);
      color: #ffffff;
    }

    .contenido {
      padding: 10px 12px;
      font-size: 16px;
      line-height: 1.55;
    }

    .contenido ::ng-deep .ProseMirror {
      min-height: 26px;
      outline: none;
    }

    .contenido ::ng-deep .ProseMirror p {
      margin: 0;
    }

    .contenido ::ng-deep .ProseMirror a {
      color: var(--color-azul-hondo, #0089b8);
      text-decoration: underline;
    }

    .contenido ::ng-deep .ProseMirror p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      float: left;
      height: 0;
      color: var(--color-apagado);
      pointer-events: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorLinea implements AfterViewInit, OnDestroy {
  private readonly plataforma = inject(PLATFORM_ID);
  private readonly contenedor = viewChild.required<ElementRef<HTMLElement>>('contenedor');

  /** HTML de una línea, sin `<p>`. Solo se lee al crear el editor. */
  readonly valor = input('');
  readonly marcador = input('');
  readonly etiqueta = input('Texto');
  readonly destacado = input(false);

  readonly cambio = output<string>();

  readonly pidiendoEnlace = signal(false);
  readonly urlEnlace = signal('');
  private readonly estado = signal(0);

  private editor?: Editor;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.plataforma)) return;

    this.editor = new Editor({
      element: this.contenedor().nativeElement,
      extensions: [
        DocumentoDeUnParrafo,
        StarterKit.configure({
          document: false,
          heading: false,
          bulletList: false,
          orderedList: false,
          listItem: false,
          blockquote: false,
          codeBlock: false,
          code: false,
          horizontalRule: false,
          strike: false,
          dropcursor: false,
          gapcursor: false,
        }),
        Link.configure({ openOnClick: false, autolink: true }),
        Placeholder.configure({ placeholder: this.marcador() }),
      ],
      content: `<p>${this.valor()}</p>`,
      onUpdate: ({ editor }) => {
        this.cambio.emit(sinParrafo(editor.getHTML()));
        this.estado.update((n) => n + 1);
      },
      onSelectionUpdate: () => this.estado.update((n) => n + 1),
    });
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  activo(marca: string): boolean {
    // Se lee la señal para que los botones se repinten al mover el cursor.
    this.estado();
    return this.editor?.isActive(marca) ?? false;
  }

  negrita(): void {
    this.editor?.chain().focus().toggleBold().run();
  }

  cursiva(): void {
    this.editor?.chain().focus().toggleItalic().run();
  }

  abrirEnlace(): void {
    this.urlEnlace.set((this.editor?.getAttributes('link')['href'] as string | undefined) ?? '');
    this.pidiendoEnlace.set(true);
  }

  aplicarEnlace(): void {
    const url = this.urlEnlace().trim();
    this.pidiendoEnlace.set(false);
    if (!url) {
      this.quitarEnlace();
      return;
    }
    // Lo que no es una ruta del sitio ni tiene esquema se toma como dirección web.
    const completa = /^(\/|https?:\/\/|mailto:|tel:)/i.test(url) ? url : `https://${url}`;
    this.editor?.chain().focus().extendMarkRange('link').setLink({ href: completa }).run();
  }

  quitarEnlace(): void {
    this.editor?.chain().focus().extendMarkRange('link').unsetLink().run();
  }
}

/** `<p>texto</p>` → `texto`. Un párrafo vacío queda como cadena vacía. */
function sinParrafo(html: string): string {
  return html.replace(/^<p>/, '').replace(/<\/p>$/, '');
}
