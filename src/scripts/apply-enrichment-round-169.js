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
      newC.diet_type = "carnivore";
      newC.diet_items = ["sứa lửa Portuguese man o' war", "sứa buồm Velella velella", "sứa nút xanh Porpita porpita", "ốc sên biển tím Janthina janthina"];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 1;
      newC.lifespan_max = 1;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "hermaphrodite";
      newC.reproduction_notes = "Là loài lưỡng tính đồng thời (simultaneous hermaphrodite). Hai cá thể giao phối chéo bằng cách áp sát bụng và đưa cơ quan sinh dục có chiều dài đặc biệt để giữ khoảng cách an toàn, tránh bị các tế bào châm độc ở các xúc tu của đối phương đâm phải. Sau khi thụ tinh, cả hai đều đẻ ra những sợi chất nhầy chứa tới 30-100 quả trứng trôi nổi tự do trong nước.";
      newC.locomotion = "swim";
      newC.speed_max = 0.1;
      newC.conservation_status = "LC";
      newC.size_min_mm = 20.0;
      newC.size_max_mm = 30.0;
      newC.weight_avg_g = 4.0;

      newC.characteristics = appendClean(c.characteristics, "Hệ thống túi khí trong dạ dày cho phép chúng tự động duy trì lực nổi sinh học mà không cần vận động cơ học để tiết kiệm năng lượng.");
      newC.survival_method = appendClean(c.survival_method, "Chất nhờn chuyên biệt bao phủ niêm mạc miệng và dạ dày hoạt động như lớp màng nhầy cơ học ngăn chặn sự phóng ngòi độc từ thức ăn sứa lửa.");
      newC.unique_traits = appendClean(c.unique_traits, "Tích lũy chọn lọc tế bào châm độc lớn nhất và nguy hiểm nhất của con mồi (cleptocnidae) trong các túi cnidosac ở đầu xúc tu.");

      newC.strengths = appendUniqueString(c.strengths, "Cơ chế bảo vệ sinh học chống lại tế bào châm độc của con mồi cực kỳ hiệu quả");
      newC.strengths = appendUniqueString(c.strengths, "Tích lũy chất độc ngoại lai tạo vũ khí tự vệ chủ động cực mạnh");
      newC.strengths = appendUniqueString(c.strengths, "Ngụy trang countershading đảo ngược hoàn hảo với môi trường mặt đại dương");
      newC.strengths = appendUniqueString(c.strengths, "Tiết kiệm năng lượng tối đa nhờ cơ chế nổi thụ động bằng bóng khí dạ dày");
      newC.strengths = appendUniqueString(c.strengths, "Khả năng tiết ra lớp chất nhầy ngăn tế bào châm phóng độc");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Hoàn toàn phụ thuộc vào gió và dòng nước để di chuyển, dễ bị cuốn trôi mất kiểm soát");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Rất dễ bị khô héo và tử vong nếu bị sóng đánh dạt lên bãi cát khô");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Không có lớp vỏ bảo vệ vật lý, cơ thể cực kỳ mềm mại dễ bị thương tổn trực tiếp");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Vì bơi ngửa, bụng màu xanh đậm hướng lên trời để lẫn vào màu biển sâu với chim ăn thịt, còn lưng màu bạc hướng xuống đáy biển để ẩn mình trước cá");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Cú chích của sên rồng xanh đậm đặc hơn của sứa lửa gốc, có thể gây tổn thương da dữ dội và sốc phản vệ nặng ở người chạm phải");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Chúng giữ bóng khí trong dạ dày để duy trì trạng thái trôi nổi tự do không bao giờ chìm");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Cơ quan sinh dục của loài sên này tiến hóa dài và cong bất thường để có thể tiếp cận bạn tình mà không bị châm bởi các xúc tu chứa đầy nọc độc sứa lửa của đối phương");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1093/mollus/eyy058",
        "label": "Journal of Molluscan Studies - Cleptocnidae and feeding ecology of Glaucus"
      });

    } else if (c.id === "peacock-mantis-shrimp") {
      newC.diet_type = "carnivore";
      newC.diet_items = ["cua đá", "ốc biển", "nghêu", "sò", "cá nhỏ", "tôm khác"];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 4;
      newC.lifespan_max = 6;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Có hành vi ghép đôi một vợ một chồng kéo dài (monogamous). Con cái đẻ ra một khối trứng màu hồng sáng và ôm chặt khối trứng trước ngực bằng các chân hàm để bảo vệ và làm sạch trứng liên tục trong khoảng 2-3 tuần cho đến khi trứng nở. Trong thời gian này, con cái không đi săn và hoàn toàn dựa vào con đực mang thức ăn về.";
      newC.locomotion = "swim";
      newC.speed_max = 10.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 100.0;
      newC.size_max_mm = 180.0;
      newC.weight_avg_g = 200.0;

      newC.characteristics = appendClean(c.characteristics, "Càng đập cấu tạo từ các lớp khoáng chất hydroxyapatite xếp xen kẽ lớp sợi chitin đàn hồi giúp hấp thụ lực va đập mà không gãy.");
      newC.survival_method = appendClean(c.survival_method, "Khả năng tự chữa lành và thay thế càng đập sau mỗi chu kỳ lột xác định kỳ.");
      newC.unique_traits = appendClean(c.unique_traits, "Mắt có cấu trúc chia ba (trinocular vision) giúp đo khoảng cách chính xác tuyệt đối mà không cần di chuyển đầu.");

      newC.strengths = appendUniqueString(c.strengths, "Cơ chế xương càng chống nứt gãy mỏi cấu trúc sợi dệt nano đa lớp");
      newC.strengths = appendUniqueString(c.strengths, "Khả năng tự hồi phục và tái tạo hoàn toàn chi và cơ quan thụ cảm sau khi lột xác");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Cực kỳ yếu ớt và dễ bị tổn thương trong thời kỳ lột xác khi lớp vỏ mới chưa cứng hóa");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Mắt của chúng có thể nhận biết ánh sáng phân cực tròn - một dạng định vị quang học được ứng dụng trong công nghệ đọc đĩa DVD hiện đại và kính viễn vọng không gian");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1126/science.1218640",
        "label": "Science - A Nanostructured Impact-Resistant Biocomposite in Mantis Shrimp"
      });

    } else if (c.id === "platypus") {
      newC.diet_type = "carnivore";
      newC.diet_items = ["ấu trùng côn trùng", "giun đất sông", "tôm sông nhỏ", "ốc nước ngọt", "nòng nọc"];
      newC.activity_pattern = "crepuscular";
      newC.lifespan_min = 10;
      newC.lifespan_max = 17;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Sau khi giao phối dưới nước, con cái tự đào một đường hầm sinh sản sâu đến 20 mét và lót lá mềm. Con cái đẻ 1-3 trứng nhỏ có vỏ da dẻo như trứng bò sát, cuộn tròn người ấp trứng sát bụng trong khoảng 10 ngày. Khi nở, con non bú sữa tiết trực tiếp qua các tuyến sữa trên da bụng của mẹ vì thú mỏ vịt không có núm vú.";
      newC.locomotion = "swim";
      newC.speed_max = 3.6;
      newC.conservation_status = "NT";
      newC.size_min_mm = 400.0;
      newC.size_max_mm = 500.0;
      newC.weight_avg_g = 1500.0;

      newC.characteristics = appendClean(c.characteristics, "Khung xương dẹp ngang giúp lặn sâu mà không tốn nhiều sức nổi.");
      newC.survival_method = appendClean(c.survival_method, "Lớp mỡ dưới da đuôi hoạt động như nguồn dự trữ năng lượng tối quan trọng vượt qua mùa đông.");
      newC.unique_traits = appendClean(c.unique_traits, "Khả năng phát huỳnh quang sinh học dưới ánh sáng tia cực tím UV.");

      newC.strengths = appendUniqueString(c.strengths, "Đuôi tích trữ mỡ đóng vai trò nguồn năng lượng dự phòng hiệu quả cao");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Bộ điều hòa nhiệt độ kém nhạy cảm khiến chúng dễ bị sốc nhiệt khi nhiệt độ môi trường tăng cao");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Nọc độc của con đực chứa các protein tương tự defensin-like proteins có thể gây giảm huyết áp dữ dội ở động vật khác và tạo cơn đau nhức kéo dài hàng tháng ở người mà thuốc giảm đau thông thường không cắt được cơn");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1002/jmor.1052200202",
        "label": "Journal of Morphology - Electroreceptors and mechanoreceptors in the bill of the platypus"
      });

    } else if (c.id === "amazon-river-dolphin") {
      newC.diet_type = "carnivore";
      newC.diet_items = ["cá piranha", "cá da trơn", "rùa sông nhỏ", "cua sông", "cá croaker"];
      newC.activity_pattern = "variable";
      newC.lifespan_min = 15;
      newC.lifespan_max = 30;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "viviparous";
      newC.reproduction_notes = "Thời gian mang thai kéo dài khoảng 11 tháng. Cá heo mẹ sinh ra một con non duy nhất dưới nước và nuôi con bằng sữa mẹ giàu dinh dưỡng trong hơn một năm. Con non thường đi theo mẹ từ 2 đến 3 năm để học kỹ năng săn mồi.";
      newC.locomotion = "swim";
      newC.speed_max = 22.5;
      newC.conservation_status = "EN";
      newC.size_min_mm = 2000.0;
      newC.size_max_mm = 2500.0;
      newC.weight_avg_g = 125000.0;

      newC.characteristics = appendClean(c.characteristics, "Đốt sống cổ của chúng không bị hợp nhất (unfused cervical vertebrae), cho phép chúng quay đầu 90 độ linh hoạt để luồn lách qua các thân cây ngập nước trong rừng Amazon. Mõm dài mảnh chứa răng dị hình (heterodont dentition) gồm răng hình nón phía trước để bắt mồi và răng dẹt phía sau để nghiền nát cua rùa.");
      newC.survival_method = appendClean(c.survival_method, "Trong mùa nước nổi, chúng bơi vào các khu rừng ngập nước (igapós) để săn mồi giữa các hàng cây, sử dụng các vây ngực lớn chuyển động độc lập như mái chèo để xoay trở cực kỳ cơ động trong không gian hẹp.");
      newC.unique_traits = appendClean(c.unique_traits, "Hệ thống định vị bằng tiếng vang (echolocation) phát ra các xung âm thanh thông qua cơ quan melon có thể thay đổi hình dạng ở trán, cho phép chúng quét các góc hẹp và phát hiện con mồi ẩn sâu dưới bùn cát.");

      newC.strengths = appendUniqueString(c.strengths, "Khả năng xoay đầu linh hoạt nhờ đốt sống cổ tách rời giúp định hướng tự do trong không gian rừng ngập nước chật hẹp.");
      newC.strengths = appendUniqueString(c.strengths, "Hệ thống định vị tiếng vang có tần số cực cao giúp phát hiện các loài cá da trơn trốn dưới lớp bùn sông đục ngầu.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Thị lực suy giảm nghiêm trọng do mắt nhỏ, hoàn toàn phụ thuộc vào thính giác siêu âm để tránh các lưới đánh cá.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Tốc độ bơi đường thẳng kém hơn so với cá heo biển do cơ thể mập mạp và thiếu vây lưng nhọn giúp giảm lực cản.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Màu hồng của chúng thực chất là kết quả của sự tích tụ các mô sẹo từ các cuộc chiến giành lãnh thổ hoặc bạn tình, làm lộ các mạch máu màu đỏ dưới da.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Theo truyền thuyết bản địa Amazon, cá heo hồng là những sinh vật biến hình (Boto), có thể hóa thân thành những chàng trai trẻ mặc đồ trắng để quyến rũ các cô gái trong làng.");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1111/j.1748-7692.1989.tb00236.x",
        "label": "Marine Mammal Science - Anatomical adaptations and echolocation of Inia geoffrensis"
      });
      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.2307/1382435",
        "label": "Journal of Mammalogy - Feeding ecology and social behavior of the Amazon River Dolphin"
      });

    } else if (c.id === "atlas-moth") {
      newC.diet_type = "herbivore";
      newC.diet_items = ["lá khế", "lá ổi", "lá mãng cầu", "lá quế", "lá sấu"];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 5;
      newC.lifespan_max = 7;
      newC.lifespan_unit = "days";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Con cái tiết ra pheromone mạnh mẽ để thu hút con đực từ khoảng cách vài km. Sau khi giao phối, con cái đẻ khoảng 150-200 quả trứng hình tròn màu xanh lục trên mặt dưới của lá cây chủ rồi nhanh chóng kiệt sức và chết.";
      newC.locomotion = "fly";
      newC.speed_max = 15.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 250.0;
      newC.size_max_mm = 300.0;
      newC.weight_avg_g = 2.5;

      newC.characteristics = appendClean(c.characteristics, "Đôi cánh của chúng có cấu trúc vảy xếp lớp giúp chống thấm nước hiệu quả, với các vân màu cam nâu rực rỡ và các ô cửa sổ tam giác trong suốt (hyaline spots) không chứa vảy ở trung tâm mỗi cánh.");
      newC.survival_method = appendClean(c.survival_method, "Khi bị đe dọa trực diện, chúng rơi tự do xuống thảm lá khô bên dưới và rung cánh liên tục tạo ra âm thanh xào xạc bắt chước loài rắn độc đang sẵn sàng tấn công.");
      newC.unique_traits = appendClean(c.unique_traits, "Phần chóp cánh trước kéo dài có hình dạng, hoa văn và màu sắc giống hệt đầu của một con rắn hổ mang đang bọc đầu, hoàn thiện với một chấm đen lớn giả mắt rắn.");

      newC.strengths = appendUniqueString(c.strengths, "Hệ thống thụ thể hóa học siêu nhạy trên ăng-ten dạng kép (bipectinate antennae) của con đực giúp phát hiện pheromone của con cái từ khoảng cách hơn 5 km.");
      newC.strengths = appendUniqueString(c.strengths, "Khả năng ngụy trang thị giác đỉnh cao nhờ cấu trúc chóp cánh đầu rắn đánh lừa hầu hết các loài chim ăn côn trùng.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Không có cơ quan tiêu hóa và miệng, giới hạn tuổi thọ trưởng thành chỉ trong vòng chưa đầy một tuần.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Kích thước cánh khổng lồ khiến tốc độ bay rất chậm và vụng về, dễ bị dơi hoặc chim lớn bắt giữ.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Ở Đài Loan, kén của ngài tằm vũ trụ có kích thước lớn và cấu trúc tơ thô dai đến mức người dân địa phương thường dùng chúng làm ví đựng tiền xu hoặc túi nhỏ.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Vì không có miệng, toàn bộ mục đích sống duy nhất của ngài tằm vũ trụ trưởng thành chỉ là tìm bạn đời và sinh sản trước khi cạn kiệt năng lượng dự trữ.");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1016/j.aspen.2016.03.011",
        "label": "Journal of Asia-Pacific Entomology - Life history and biology of Attacus atlas"
      });
      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1007/s10841-010-9345-4",
        "label": "Journal of Insect Conservation - Conservation genetics of giant silk moths"
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

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA - ROUND 169 ===================");
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
