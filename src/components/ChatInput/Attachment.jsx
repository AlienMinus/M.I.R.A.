import { useRef } from "react";

export default function Attachment({
  onFilesSelected,
  accept = "*/*",
  multiple = true,
  children,
  className = "",
  disabled = false
}) {
  const inputRef = useRef(null);

  const handleClick = (e) => {
    if (disabled) return;
    // Trigger the hidden file input
    inputRef.current?.click();
  };

  const handleChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && onFilesSelected) {
      onFilesSelected(files);
    }
    // Reset value to allow re-selection of the same file if needed
    e.target.value = "";
  };

  return (
    <>
      <input
        type="file"
        ref={inputRef}
        style={{ display: "none" }}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleChange}
      />
      <div onClick={handleClick} className={className} style={{ cursor: disabled ? "default" : "pointer" }}>
        {children}
      </div>
    </>
  );
}