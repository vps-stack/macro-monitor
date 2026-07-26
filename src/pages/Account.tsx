import { FormEvent, useEffect, useState } from "react";
import Navigation from "../components/Organisms/Navigation";
import FormField from "../components/Molecules/FormField";
import Button from "../components/Atoms/Button";
import { useAuth } from "../context/AuthContext";
import {
   deleteAccount,
   updateEmail,
   updatePassword,
} from "../services/api";
import styles from "./Account.module.scss";

type Feedback = {
   type: "success" | "error";
   text: string;
} | null;

const getErrorMessage = (error: unknown) =>
   error instanceof Error ? error.message : "Something went wrong. Please try again.";

export default function Account() {
   const { user, setUser } = useAuth();
   const [email, setEmail] = useState(user?.email ?? "");
   const [emailPassword, setEmailPassword] = useState("");
   const [emailFeedback, setEmailFeedback] = useState<Feedback>(null);
   const [passwords, setPasswords] = useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
   });
   const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null);
   const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
   const [deletePassword, setDeletePassword] = useState("");
   const [deleteFeedback, setDeleteFeedback] = useState<Feedback>(null);
   const [pendingAction, setPendingAction] = useState<"email" | "password" | "delete" | null>(
      null
   );

   useEffect(() => {
      setEmail(user?.email ?? "");
   }, [user?.email]);

   const handleEmailSubmit = async (event: FormEvent) => {
      event.preventDefault();
      setEmailFeedback(null);

      if (email.trim().toLowerCase() === user?.email.toLowerCase()) {
         setEmailFeedback({ type: "error", text: "Please enter a different email address." });
         return;
      }

      setPendingAction("email");
      try {
         const data = await updateEmail(email, emailPassword);
         setUser(data.user);
         setEmailPassword("");
         setEmailFeedback({ type: "success", text: "Your email address has been updated." });
      } catch (error) {
         setEmailFeedback({ type: "error", text: getErrorMessage(error) });
      } finally {
         setPendingAction(null);
      }
   };

   const handlePasswordSubmit = async (event: FormEvent) => {
      event.preventDefault();
      setPasswordFeedback(null);

      if (passwords.newPassword !== passwords.confirmPassword) {
         setPasswordFeedback({ type: "error", text: "The new passwords do not match." });
         return;
      }

      setPendingAction("password");
      try {
         await updatePassword(passwords.currentPassword, passwords.newPassword);
         setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
         setPasswordFeedback({ type: "success", text: "Your password has been updated." });
      } catch (error) {
         setPasswordFeedback({ type: "error", text: getErrorMessage(error) });
      } finally {
         setPendingAction(null);
      }
   };

   const handleDelete = async (event: FormEvent) => {
      event.preventDefault();
      setDeleteFeedback(null);
      setPendingAction("delete");

      try {
         await deleteAccount(deletePassword);
         setUser(null);
         window.location.href = "/";
      } catch (error) {
         setDeleteFeedback({ type: "error", text: getErrorMessage(error) });
         setPendingAction(null);
      }
   };

   const updatePasswordField = (event: React.ChangeEvent<HTMLInputElement>) => {
      setPasswords({ ...passwords, [event.target.name]: event.target.value });
      setPasswordFeedback(null);
   };

   return (
      <main className={styles.account}>
         <div className={styles.navWrapper}>
            <Navigation />
         </div>

         <h1>Account</h1>

         <div className={styles.content}>
            <section className={styles.card}>
               <div className={styles.sectionHeader}>
                  <h2>Profile</h2>
                  <p>Your personal account information.</p>
               </div>
               <dl className={styles.profileDetails}>
                  <div>
                     <dt>Name</dt>
                     <dd>{user?.name || "Not provided"}</dd>
                  </div>
                  <div>
                     <dt>Email</dt>
                     <dd>{user?.email}</dd>
                  </div>
               </dl>
            </section>

            <section className={styles.card}>
               <div className={styles.sectionHeader}>
                  <h2>Change email</h2>
                  <p>Confirm this change with your current password.</p>
               </div>
               <form onSubmit={handleEmailSubmit}>
                  <FormField
                     label="New email"
                     type="email"
                     name="email"
                     value={email}
                     onChange={(event) => {
                        setEmail(event.target.value);
                        setEmailFeedback(null);
                     }}
                     appearance="dark"
                     autoComplete="email"
                     required
                     disabled={pendingAction !== null}
                  />
                  <FormField
                     label="Current password"
                     type="password"
                     name="emailPassword"
                     value={emailPassword}
                     onChange={(event) => {
                        setEmailPassword(event.target.value);
                        setEmailFeedback(null);
                     }}
                     appearance="dark"
                     autoComplete="current-password"
                     required
                     disabled={pendingAction !== null}
                  />
                  {emailFeedback && (
                     <p className={styles[emailFeedback.type]} role="status">
                        {emailFeedback.text}
                     </p>
                  )}
                  <div className={styles.action}>
                     <Button
                        label={pendingAction === "email" ? "Saving..." : "Save email"}
                        type="submit"
                        appearance="typeB"
                        disabled={pendingAction !== null}
                     />
                  </div>
               </form>
            </section>

            <section className={styles.card}>
               <div className={styles.sectionHeader}>
                  <h2>Change password</h2>
                  <p>Choose a new password with at least 6 characters.</p>
               </div>
               <form onSubmit={handlePasswordSubmit}>
                  <FormField
                     label="Current password"
                     type="password"
                     name="currentPassword"
                     value={passwords.currentPassword}
                     onChange={updatePasswordField}
                     appearance="dark"
                     autoComplete="current-password"
                     required
                     disabled={pendingAction !== null}
                  />
                  <FormField
                     label="New password"
                     type="password"
                     name="newPassword"
                     value={passwords.newPassword}
                     onChange={updatePasswordField}
                     appearance="dark"
                     autoComplete="new-password"
                     minLength={6}
                     required
                     disabled={pendingAction !== null}
                  />
                  <FormField
                     label="Confirm new password"
                     type="password"
                     name="confirmPassword"
                     value={passwords.confirmPassword}
                     onChange={updatePasswordField}
                     appearance="dark"
                     autoComplete="new-password"
                     minLength={6}
                     required
                     disabled={pendingAction !== null}
                  />
                  {passwordFeedback && (
                     <p className={styles[passwordFeedback.type]} role="status">
                        {passwordFeedback.text}
                     </p>
                  )}
                  <div className={styles.action}>
                     <Button
                        label={pendingAction === "password" ? "Saving..." : "Save password"}
                        type="submit"
                        appearance="typeB"
                        disabled={pendingAction !== null}
                     />
                  </div>
               </form>
            </section>

            <section className={`${styles.card} ${styles.dangerZone}`}>
               <div className={styles.sectionHeader}>
                  <h2>Delete account</h2>
                  <p>
                     Permanently delete your account and all nutrition data. This cannot be
                     undone.
                  </p>
               </div>

               {!showDeleteConfirmation ? (
                  <Button
                     label="Delete account"
                     type="button"
                     appearance="typeDanger"
                     onClick={() => setShowDeleteConfirmation(true)}
                  />
               ) : (
                  <form onSubmit={handleDelete} className={styles.deleteConfirmation}>
                     <FormField
                        label="Enter your password to confirm"
                        type="password"
                        name="deletePassword"
                        value={deletePassword}
                        onChange={(event) => {
                           setDeletePassword(event.target.value);
                           setDeleteFeedback(null);
                        }}
                        appearance="dark"
                        autoComplete="current-password"
                        required
                        disabled={pendingAction !== null}
                     />
                     {deleteFeedback && (
                        <p className={styles.error} role="status">
                           {deleteFeedback.text}
                        </p>
                     )}
                     <div className={styles.dangerActions}>
                        <Button
                           label="Cancel"
                           type="button"
                           appearance="typeB"
                           onClick={() => {
                              setShowDeleteConfirmation(false);
                              setDeletePassword("");
                              setDeleteFeedback(null);
                           }}
                           disabled={pendingAction !== null}
                        />
                        <Button
                           label={pendingAction === "delete" ? "Deleting..." : "Delete permanently"}
                           type="submit"
                           appearance="typeDanger"
                           disabled={pendingAction !== null}
                        />
                     </div>
                  </form>
               )}
            </section>
         </div>
      </main>
   );
}
