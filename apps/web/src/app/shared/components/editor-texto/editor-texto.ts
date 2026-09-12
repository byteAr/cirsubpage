import { CommonModule, isPlatformBrowser } from '@angular/common';
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
import { FormsModule } from '@angular/forms';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import Youtube from '@tiptap/extension-youtube';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

/**
 * Editor de texto enriquecido de la nota, sobre TipTap.
 *
 * Devuelve el HTML y la estructura en JSON: el JSON es la fuente de verdad para
 * volver a editar y el HTML es lo que el sitio publica. El backend vuelve a
 * sanear el HTML al guardar, así que esto es comodidad, no seguridad.
 *
 * El editor solo corre en el navegador; en el servidor se muestra un recuadro
 * vacío.
 */
@Component({
  selector: 'app-editor-texto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editor-texto.html',
  styleUrl: './editor-texto.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorTexto implements AfterViewInit, OnDestroy {
  private readonly plataforma = inject(PLATFORM_ID);
  private readonly contenedor = viewChild.required<ElementRef<HTMLElement>>('contenedor');

  readonly contenidoInicial = input<string>('');
  readonly marcadorDePosicion = input('Escribí la nota acá. Podés pegar texto, imágenes y videos.');

  readonly cambio = output<{ html: string; json: Record<string, unknown> }>();
  readonly pedirImagen = output<void>();

  readonly listo = signal(false);
  readonly popoverEnlace = signal(false);
  readonly popoverColor = signal(false);
  readonly popoverVideo = signal(false);
  readonly urlEnlace = signal('');
  readonly urlVideo = signal('');
  readonly estado = signal(0);

  readonly colores: readonly { nombre: string; valor: string }[] = [
    { nombre: 'Tinta', valor: '#16303F' },
    { nombre: 'Pizarra', valor: '#4E6473' },
    { nombre: 'Azul', valor: '#0089B8' },
    { nombre: 'Teal', valor: '#00A99D' },
    { nombre: 'Verde', valor: '#00B24A' },
    { nombre: 'Rojo', valor: '#C7392E' },
  ];

  private editor?: Editor;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.plataforma)) return;

    this.editor = new Editor({
      element: this.contenedor().nativeElement,
      extensions: [
        StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
        Underline,
        TextStyle,
        Color,
        Highlight.configure({ multicolor: true }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer' } }),
        Image.configure({ inline: false, allowBase64: false }),
        Youtube.configure({ controls: true, nocookie: true, width: 960, height: 540 }),
        Table.configure({ resizable: false }),
        TableRow,
        TableHeader,
        TableCell,
        Placeholder.configure({ placeholder: this.marcadorDePosicion() }),
      ],
      content: this.contenidoInicial() || '',
      onUpdate: ({ editor }) => {
        this.cambio.emit({
          html: editor.getHTML(),
          json: editor.getJSON() as Record<string, unknown>,
        });
        this.estado.update((n) => n + 1);
      },
      onSelectionUpdate: () => this.estado.update((n) => n + 1),
    });

    this.listo.set(true);
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  /** Reemplaza el contenido sin disparar un evento de cambio. */
  cargar(html: string): void {
    // El segundo argumento en false evita disparar `onUpdate` al recargar.
    this.editor?.commands.setContent(html || '', false);
  }

  activo(nombre: string, opciones?: Record<string, unknown>): boolean {
    // Se lee la señal para que los botones se repinten al mover el cursor.
    this.estado();
    return this.editor?.isActive(nombre, opciones) ?? false;
  }

  comando(accion: string, valor?: unknown): void {
    const cadena = this.editor?.chain().focus();
    if (!cadena) return;

    switch (accion) {
      case 'negrita': cadena.toggleBold().run(); break;
      case 'cursiva': cadena.toggleItalic().run(); break;
      case 'subrayado': cadena.toggleUnderline().run(); break;
      case 'tachado': cadena.toggleStrike().run(); break;
      case 'resaltado': cadena.toggleHighlight({ color: '#FFF2A8' }).run(); break;
      case 'titulo2': cadena.toggleHeading({ level: 2 }).run(); break;
      case 'titulo3': cadena.toggleHeading({ level: 3 }).run(); break;
      case 'parrafo': cadena.setParagraph().run(); break;
      case 'vinetas': cadena.toggleBulletList().run(); break;
      case 'numerada': cadena.toggleOrderedList().run(); break;
      case 'cita': cadena.toggleBlockquote().run(); break;
      case 'codigo': cadena.toggleCodeBlock().run(); break;
      case 'separador': cadena.setHorizontalRule().run(); break;
      case 'izquierda': cadena.setTextAlign('left').run(); break;
      case 'centro': cadena.setTextAlign('center').run(); break;
      case 'derecha': cadena.setTextAlign('right').run(); break;
      case 'tabla': cadena.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); break;
      case 'color': cadena.setColor(String(valor)).run(); this.popoverColor.set(false); break;
      case 'sinColor': cadena.unsetColor().run(); this.popoverColor.set(false); break;
      case 'deshacer': cadena.undo().run(); break;
      case 'rehacer': cadena.redo().run(); break;
      default: break;
    }
  }

  abrirEnlace(): void {
    this.urlEnlace.set((this.editor?.getAttributes('link')['href'] as string) ?? '');
    this.popoverEnlace.set(true);
  }

  aplicarEnlace(): void {
    const url = this.urlEnlace().trim();
    const cadena = this.editor?.chain().focus();
    if (!cadena) return;

    if (!url) {
      cadena.unsetLink().run();
    } else {
      const completa = /^https?:\/\//i.test(url) || url.startsWith('mailto:') ? url : `https://${url}`;
      cadena.extendMarkRange('link').setLink({ href: completa }).run();
    }

    this.popoverEnlace.set(false);
    this.urlEnlace.set('');
  }

  aplicarVideo(): void {
    const url = this.urlVideo().trim();
    if (url) this.editor?.chain().focus().setYoutubeVideo({ src: url }).run();
    this.popoverVideo.set(false);
    this.urlVideo.set('');
  }

  /** Inserta una imagen ya subida a la biblioteca. */
  insertarImagen(url: string, alt: string): void {
    this.editor?.chain().focus().setImage({ src: url, alt }).run();
  }
}
