
export default function CreateCommunityPage() {
  return (
    <div>
      <h1>Create a new community</h1>
      {/* Form for creating a new community */}
      <form>
        <div>
          <label htmlFor="communityName">Community Name:</label>
          <input type="text" id="communityName" name="communityName" required />
        </div>
        <div>
          <label htmlFor="description">Description:</label>
          <textarea id="description" name="description" required></textarea>
        </div>
        <button type="submit">Create Community</button>
      </form> 
    </div>
  );
} 