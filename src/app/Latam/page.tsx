"use client";
import { useRef } from "react";

function Latam(){
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    
        const adjustHeight = () => {
            const textarea = textareaRef.current;
            if (textarea) {
              textarea.style.height = "auto";
              const maxHeight = 98;
              textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight) + 5}px`;
            }
          };

    return(
        <div className="flex-1 w-full relative">
            <h1>
                esto es LATAM
            </h1>
            <form className="w-full flex justify-center absolute bottom-5/100">
                <textarea 
                ref={textareaRef}
                className="px-3 py-1 border border-gray-200 rounded-md resize-none overflow-y-auto max-h-[50rem] w-85/100" 
                rows={1}
                placeholder="Mensaje" 
                onInput={adjustHeight}/>
                <button className="mx-5" type="submit">Enviar</button>
            </form>
        </div>
    )
}

export default Latam