function UserCard({
  user,
  type,
  onStartAiCall,
  onFollowUpCall,
  callLoadingUserId,
  followUpLoadingUserId,
  onWhatsApp,
  whatsappLoadingUserId,
}) {
  const isCalling = callLoadingUserId === user._id;
  const isFollowUpCalling = followUpLoadingUserId === user._id;
  const isWhatsappSending = whatsappLoadingUserId === user._id;
  const latestCall = user.callStatus?.lastCallAt
    ? {
        callType: user.callStatus.lastCallType,
        status: "completed",
        callAt: user.callStatus.lastCallAt,
      }
    : null;

  return (
    <article className="admin-user-card">
      <div className="admin-user-head">
        <div>
          <h4>{user.name}</h4>
          <p>
            {user.phoneNo} | {user.location?.district}, {user.location?.state}
          </p>
        </div>
        <span className={`admin-user-badge ${type}`}>{type === "keypad" ? "KEYPAD / LOW APP" : "SMARTPHONE"}</span>
      </div>

      <div className="admin-scheme-list">
        {(user.schemes || []).slice(0, 3).map((scheme) => (
          <div className="admin-scheme-item" key={`${user._id}-${scheme._id || scheme.title}`}>
            <strong>{scheme.title}</strong>
            <span>{scheme.benefit}</span>
          </div>
        ))}
      </div>

      {latestCall ? (
        <div className="admin-call-status">
          <strong>Last AI call:</strong> {latestCall.callType} | {latestCall.status} |{" "}
          {new Date(latestCall.callAt || latestCall.createdAt).toLocaleString("en-IN")}
        </div>
      ) : (
        <div className="admin-call-status">No call activity yet.</div>
      )}

      {type === "keypad" ? (
        <div className="admin-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onStartAiCall(user)}
            disabled={isCalling}
          >
            {isCalling ? "Calling via AI..." : "Call Now (AI Assistant)"}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => onFollowUpCall(user)}
            disabled={isFollowUpCalling}
          >
            {isFollowUpCalling ? "Calling Back..." : "Call Back: Ask Applied?"}
          </button>
        </div>
      ) : (
        <div className="admin-actions">
          <button
            type="button"
            className="btn btn-whatsapp"
            onClick={() => onWhatsApp(user)}
            disabled={isWhatsappSending}
            title="Send schemes on WhatsApp"
          >
            {isWhatsappSending ? "Sending..." : "🟢 WhatsApp Schemes"}
          </button>
        </div>
      )}
    </article>
  );
}

function AdminTab({
  data,
  loading,
  onStartAiCall,
  onFollowUpCall,
  callLoadingUserId,
  followUpLoadingUserId,
  onWhatsApp,
  whatsappLoadingUserId,
}) {
  const keypadUsers = data?.keypadUsers || [];
  const smartphoneUsers = data?.smartphoneUsers || [];

  return (
    <section className="tab-body">
      {loading ? <div className="loading">Loading admin users...</div> : null}
      <div className="admin-top-grid">
        <div className="admin-metric">
          <h3>{smartphoneUsers.length}</h3>
          <p>Smartphone Users</p>
        </div>
        <div className="admin-metric">
          <h3>{keypadUsers.length}</h3>
          <p>Keypad / Low App Users</p>
        </div>
      </div>

      <div className="admin-columns">
        <div className="admin-column">
          <div className="admin-column-head">Keypad / Low Smartphone Users</div>
          <div className="admin-user-list">
            {keypadUsers.length ? (
              keypadUsers.map((user) => (
                <UserCard
                  key={user._id}
                  user={user}
                  type="keypad"
                  onStartAiCall={onStartAiCall}
                  onFollowUpCall={onFollowUpCall}
                  callLoadingUserId={callLoadingUserId}
                  followUpLoadingUserId={followUpLoadingUserId}
                />
              ))
            ) : (
              <div className="empty-state">No keypad users found.</div>
            )}
          </div>
        </div>

        <div className="admin-column">
          <div className="admin-column-head">Smartphone Users</div>
          <div className="admin-user-list">
            {smartphoneUsers.length ? (
              smartphoneUsers.map((user) => (
                <UserCard
                  key={user._id}
                  user={user}
                  type="smartphone"
                  onWhatsApp={onWhatsApp}
                  whatsappLoadingUserId={whatsappLoadingUserId}
                />
              ))
            ) : (
              <div className="empty-state">No smartphone users found.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AdminTab;
