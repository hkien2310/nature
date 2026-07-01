const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const envPath = path.join(__dirname, "../.env.local");
let supabaseUrl = "";
let supabaseAnonKey = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.*)/);
  if (urlMatch) {
    supabaseUrl = urlMatch[1].replace(/['"]/g, "").trim();
  }
  if (keyMatch) {
    supabaseAnonKey = keyMatch[1].replace(/['"]/g, "").trim();
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function appendClean(currentText, newText) {
  if (!currentText) return newText.trim();
  const cleanCurrent = currentText.trim();
  const cleanNew = newText.trim();
  if (cleanCurrent.includes(cleanNew)) {
    return cleanCurrent;
  }
  return cleanCurrent + " " + cleanNew;
}

function appendUniqueString(arr, str) {
  if (!arr) arr = [];
  const cleanStr = str.trim();
  if (!arr.some(item => item.trim() === cleanStr)) {
    arr.push(cleanStr);
  }
  return arr;
}

function appendUniqueSource(arr, src) {
  if (!arr) arr = [];
  const cleanUrl = src.url.trim();
  if (!arr.some(s => s.url.trim() === cleanUrl)) {
    arr.push(src);
  }
  return arr;
}

async function run() {
  console.log("Fetching lowest 5 creatures based on enrichment_count...");
  
  let { data: creatures, error } = await supabase
    .from("creatures")
    .select("*");

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  // Sort by enrichment_count ASC, then by id ASC
  creatures.sort((a, b) => {
    const countA = a.enrichment_count || 0;
    const countB = b.enrichment_count || 0;
    if (countA !== countB) {
      return countA - countB;
    }
    return a.id.localeCompare(b.id);
  });

  const targets = creatures.slice(0, 5);
  console.log(`Selected targets to enrich: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    if (c.id === "blue-dragon") {
      newC.characteristics = appendClean(c.characteristics, "Hệ thống cơ trơn ở bàn chân nhầy đã tiêu giảm đáng kể, thay thế bằng khả năng bám dính sức căng bề mặt nhờ màng nhầy mỏng kỵ nước phủ toàn bộ cơ thể.");
      newC.survival_method = appendClean(c.survival_method, "Khi gặp bão lớn hoặc luồng gió đẩy trực diện vào bờ cát, sên rồng xanh có phản xạ nuốt thêm nước vào dạ dày để tự chìm xuống tầng nước sâu hơn một chút nhằm tránh bị sóng đánh dạt.");
      newC.unique_traits = appendClean(c.unique_traits, "Khả năng tái định vị các tế bào châm độc chưa phóng (nematocysts) di chuyển qua thành ống tiêu hóa phân nhánh của chúng lên các tế bào cnidosac chuyên biệt ở rìa cerata mà không làm kích hoạt phản xạ phóng độc.");

      newC.strengths = appendUniqueString(c.strengths, "Cơ chế vận chuyển nội bào chủ động cho phép chuyển nematocysts qua vách tế bào ruột an toàn.");
      newC.strengths = appendUniqueString(c.strengths, "Khả năng chịu đựng nồng độ độc tố tetrodotoxin và peptide độc trong sứa lửa mà không bị hoại tử tế bào dạ dày.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Khi sụt giảm sức căng bề mặt của nước (do vết dầu loang hoặc xà phòng), chúng mất lực nâng và dễ bị chìm chết ngạt.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Chúng là loài ăn thịt đồng loại khi nguồn thức ăn sứa khan hiếm; những con sên rồng lớn hơn sẽ tấn công và nuốt chửng con nhỏ hơn để chiếm đoạt ngòi độc.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Phần miệng của sên rồng xanh sở hữu một bộ răng kitin sắc bén (radula) dạng lưỡi cưa, dùng để ngoạm và xé trực tiếp từng mảng thịt sứa dai.");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.2988/0005-7940-128.2.148",
        "label": "Proceedings of the Biological Society of Washington - Distribution of Glaucus atlanticus"
      });

    } else if (c.id === "peacock-mantis-shrimp") {
      newC.characteristics = appendClean(c.characteristics, "Vỏ giáp ngực (carapace) có cấu trúc các lớp vảy xếp tầng tạo nên độ bền kéo cao vượt bậc so với các loài giáp xác thông thường.");
      newC.survival_method = appendClean(c.survival_method, "Khi gia cố hang, chúng sử dụng cú đập búa tạ để đập vỡ đá san hô thành các mảnh vụn nhỏ, rồi dùng chân hàm xếp chúng làm tường bảo vệ chống xói mòn.");
      newC.unique_traits = appendClean(c.unique_traits, "Sở hữu cơ cấu chốt cơ học (meral click) ở càng đập, cho phép cơ bắp co rút tích lũy năng lượng đàn hồi mà không dịch chuyển càng cho đến khi chốt được giải phóng tức thì.");

      newC.strengths = appendUniqueString(c.strengths, "Sở hữu bộ càng búa tạ cấu trúc composite nano xếp xoắn ốc (helicoidal) hấp thụ 90% lực phản chấn.");
      newC.strengths = appendUniqueString(c.strengths, "Khả năng phát hiện ánh sáng phân cực tuyến tính giúp định vị kẻ thù ẩn mình dưới lớp san hô phản xạ.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Sau mỗi lần lột xác, tôm tít phải trốn sâu trong hang tối từ 1-2 tuần, hoàn toàn mất khả năng tự vệ và dễ chết nếu hang bị xâm phạm.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Mặc dù sở hữu cú đấm hủy diệt, tôm tít búa tạ rất hạn chế đập nhau trực tiếp bằng càng khi tranh chấp hang; thay vào đó, chúng quay lưng giơ đuôi bọc giáp dày (telson) để chịu đòn của đối thủ như một màn đo sức bền.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Cơ chế tích năng lượng đàn hồi ở càng của tôm tít giống như một cây cung kéo căng, giải phóng toàn bộ năng lượng tích lũy chỉ trong vòng chưa đầy 3 mili giây.");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1098/rsbl.2005.0374",
        "label": "Biology Letters - Extreme impact performance of mantis shrimp"
      });

    } else if (c.id === "platypus") {
      newC.characteristics = appendClean(c.characteristics, "Mỏ của thú mỏ vịt không phải bằng sừng cứng như chim mà là một lớp da mềm mại, dẻo dai kéo dài trên khung xương sọ, chứa mạng lưới dày đặc các thụ thể cơ học và điện học.");
      newC.survival_method = appendClean(c.survival_method, "Chúng lưu trữ tạm thời con mồi kiếm được dưới đáy sông trong hai túi má (cheek pouches), sau đó ngoi lên mặt nước và dùng những mảnh sỏi nhỏ ngậm sẵn trong miệng để nghiền nát thức ăn trước khi nuốt.");
      newC.unique_traits = appendClean(c.unique_traits, "Bộ gen của thú mỏ vịt có sự pha trộn kỳ lạ giữa động vật có vú, chim và bò sát, sở hữu tới 10 nhiễm sắc thể giới tính (5X và 5Y ở con đực, 10X ở con cái).");

      newC.strengths = appendUniqueString(c.strengths, "Khả năng giảm nhịp tim (bradycardia) xuống dưới 15 nhịp/phút khi lặn sâu để tiết kiệm oxy.");
      newC.strengths = appendUniqueString(c.strengths, "Hệ thống thụ thể điện cảm ứng (electroreceptors) lên tới 40.000 thụ thể trên mỏ giúp xây dựng bản đồ điện học 3D của đáy sông đục tối.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Bộ lông dày chống thấm nước rất dễ bị dính dầu hoặc hóa chất hoạt tính bề mặt, làm hỏng lớp cách nhiệt và khiến chúng nhanh chóng chết vì hạ thân nhiệt.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Vì không có dạ dày thực sự nên thực quản của chúng nối thẳng vào ruột, thức ăn chỉ được tiêu hóa bằng enzyme ở ruột non mà không qua quá trình phân giải bằng axit dạ dày.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Nọc độc của thú mỏ vịt đực chỉ được sản xuất mạnh mẽ trong mùa sinh sản, chứng tỏ nó tiến hóa chủ yếu như một vũ khí tranh giành quyền giao phối với các con đực khác hơn là tự vệ trước kẻ thù.");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1093/jmammal/gyy112",
        "label": "Journal of Mammalogy - Biofluorescence in the platypus Ornithorhynchus anatinus"
      });

    } else if (c.id === "helmeted-hornbill") {
      newC.characteristics = appendClean(c.characteristics, "Phần da cổ trần không lông có màu đỏ tươi ở con đực và màu xanh lam nhạt ở con cái, đóng vai trò như bảng tín hiệu thị giác biểu thị trạng thái kích động và sức khỏe.");
      newC.survival_method = appendClean(c.survival_method, "Chúng sử dụng chiếc mũ sừng đặc để gõ mạnh vào các hốc cây mục nhằm xua đuổi các loài côn trùng, thằn lằn trốn bên trong bò ra ngoài để bắt, đồng thời húc mạnh vào thân cây vả để rung rụng các quả chín.");
      newC.unique_traits = appendClean(c.unique_traits, "Loài chim duy nhất sử dụng mũ sừng đặc để không chiến húc đầu (casque-butting) ngay trên không trung, tạo ra những tiếng động chát chúa vang xa nhiều km trong rừng rậm.");

      newC.strengths = appendUniqueString(c.strengths, "Cơ cổ và các đốt sống cổ hợp nhất một phần cung cấp độ vững chắc tuyệt đối chống chấn thương sọ nhận lực.");
      newC.strengths = appendUniqueString(c.strengths, "Mỏ có lực kẹp lớn và kết cấu mút chống trượt giúp giữ chắc các loại hạt và con mồi trơn trượt.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Phụ thuộc vào các cây gỗ lớn cao hơn 30 mét trong rừng nguyên sinh để làm tổ hốc, làm giảm đáng kể khả năng làm tổ ở rừng thứ sinh.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Quá trình chim cái tự giam mình trong tổ đất kéo dài suốt 4-5 tháng khiến chim cái rụng toàn bộ lông bay (molt) cùng lúc. Điều này có nghĩa là chim mẹ hoàn toàn mất khả năng bay và phụ thuộc 100% vào chim bố nuôi mạng.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Chiếc mũ sừng đặc của hồng hoàng mũ cát chiếm tới 10% tổng trọng lượng cơ thể của chúng, làm thay đổi trọng tâm của chim khi bay.");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1017/S003060531900132X",
        "label": "Oryx - Conservation emergency: illegal trade and nesting success of Rhinoplax vigil"
      });

    } else if (c.id === "mantis-shrimp") {
      newC.characteristics = appendClean(c.characteristics, "Càng đập sở hữu cấu trúc xương đùi (merus) lõm sâu chứa cơ co rút cực lớn xếp xen kẽ các dải gân kitin siêu đàn hồi.");
      newC.survival_method = appendClean(c.survival_method, "Di chuyển linh hoạt bằng cách kết hợp giữa bò bằng chân ngực dưới đáy cát và bơi phản lực nước bằng các tấm vây bụng (pleopods) khi cần di chuyển nhanh cự ly ngắn.");
      newC.unique_traits = appendClean(c.unique_traits, "Mắt của chúng có dải phân tách trung tâm (midband) chia mắt thành ba phần riêng biệt, cho phép mỗi mắt tự xây dựng tiêu cự nổi 3D độc lập (monocular stereopsis).");

      newC.strengths = appendUniqueString(c.strengths, "Khả năng phân biệt 12 màu cơ bản cùng 4 kênh phân cực tròn và tuyến tính.");
      newC.strengths = appendUniqueString(c.strengths, "Lực cơ bắp phóng càng đạt gia tốc 104 km/s² - nhanh hơn bất kỳ động vật không xương sống dưới nước nào.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Lượng canxi tiêu thụ lớn để làm cứng vỏ giáp sau mỗi chu kỳ lột xác, nếu thiếu canxi vỏ sẽ mềm và chúng dễ chết.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Lớp giáp đuôi (telson) của chúng có hoa văn gờ nổi và cấu trúc rỗng tổ ong giúp hấp thụ 69% lực đập từ càng đối thủ mà không làm nứt lớp giáp chính.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Cú đập càng của chúng nhanh đến mức tạo ra lực ma sát nước lớn làm bốc hơi nước cục bộ xung quanh càng trong tích tắc.");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1098/rsbl.2005.0374",
        "label": "Biology Letters - Extreme impact performance of mantis shrimp"
      });
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Successfully generated temp-enrich.json at ${enrichPath}`);

  // Call update-enrichment.js
  console.log("Calling update-enrichment.js script to persist the data...");
  try {
    const stdout = execSync(`node ${path.join(__dirname, "update-enrichment.js")} ${enrichPath}`, { encoding: "utf-8" });
    console.log(stdout);
  } catch (err) {
    console.error("Error executing update-enrichment.js:", err.message);
    process.exit(1);
  }

  // Cleanup
  console.log("Cleaning up temporary JSON file...");
  if (fs.existsSync(enrichPath)) {
    fs.unlinkSync(enrichPath);
  }
  console.log("Cleanup done.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA - ROUND 170 ===================");
  console.log("Đã làm giàu sâu thông tin sinh học cấu trúc và đặc tính đặc biệt cho 5 sinh vật:");
  console.log("------------------------------------------------------------------------------");
  console.log("STT | Tên Sinh Vật | ID | Lớp | Lần Làm Giàu (New)");
  console.log("------------------------------------------------------------------------------");
  enriched.forEach((c, idx) => {
    console.log(`${idx + 1} | ${c.name} | ${c.id} | ${c.class} | ${c.enrichment_count}`);
  });
  console.log("==============================================================================\n");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
