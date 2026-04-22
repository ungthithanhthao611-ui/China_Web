const fs = require('fs');
const file = 'e:\\uiChina_Web\\China_Web_FE\\src\\views\\admin\\modules\\entity-manager\\EntityManager.vue';
let content = fs.readFileSync(file, 'utf-8');

const target = `  } catch (error) {
    formErrors.value = [error.message || "Failed to save record."];
    notifyError(error.message || "Failed to save record.");
  } finally {`;

const replacement = `  } catch (error) {
    const errorMsg = error.message || "Failed to save record.";
    formErrors.value = [errorMsg];
    notifyError(errorMsg);
    
    // Nếu bản ghi không còn tồn tại, tải lại danh sách
    if (error.status === 404 || errorMsg.toLowerCase().includes("not found")) {
      closeForm();
      loadRecords().catch(() => {});
    }
  } finally {`;

if (content.includes(target)) {
  fs.writeFileSync(file, content.replace(target, replacement));
  console.log("PATCH_CATCH_BLOCK_DONE");
} else {
  // Try CRLF fallback
  const targetCRLF = target.replace(/\n/g, '\r\n');
  if (content.includes(targetCRLF)) {
    fs.writeFileSync(file, content.replace(targetCRLF, replacement.replace(/\n/g, '\r\n')));
    console.log("PATCH_CATCH_BLOCK_DONE");
  } else {
    // Try LF fallback
    const targetLF = target.replace(/\r\n/g, '\n');
    if (content.includes(targetLF)) {
      fs.writeFileSync(file, content.replace(targetLF, replacement.replace(/\r\n/g, '\n')));
      console.log("PATCH_CATCH_BLOCK_DONE");
    } else {
      console.error("TARGET NOT FOUND");
    }
  }
}
