function Message({ text, sender }) {
  return (
    <div className={`message ${sender}`}>
      <span className="avatar"></span> {/* Placeholder for avatar */}
      <p>{text}</p>
    </div>
  );
}

export default Message;
