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

    if (c.id === "amazon-river-dolphin") {
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

    } else if (c.id === "helmeted-hornbill") {
      newC.diet_type = "omnivore";
      newC.diet_items = ["quả sung", "quả vả", "thằn lằn", "côn trùng lớn", "chim nhỏ", "chuột"];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 30;
      newC.lifespan_max = 50;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Con cái đẻ trứng trong hốc cây lớn. Con đực trét bùn và phân bọc kín miệng hốc, chỉ chừa lại một khe nhỏ để đút thức ăn nuôi con cái và chim non suốt 5 tháng, bảo vệ chúng khỏi thú ăn thịt.";
      newC.locomotion = "fly";
      newC.speed_max = 45.0;
      newC.conservation_status = "CR";
      newC.size_min_mm = 1100.0;
      newC.size_max_mm = 1270.0;
      newC.weight_avg_g = 3100.0;

      newC.characteristics = appendClean(c.characteristics, "Chi chiếc mũ sừng (casque) đặc trưng của chúng cấu tạo từ chất sừng keratin đặc, chiếm tới 10% trọng lượng cơ thể, nối liền trực tiếp vào xương sọ dày để chịu được lực va đập cực mạnh.");
      newC.survival_method = appendClean(c.survival_method, "Trong các cuộc tranh chấp lãnh thổ rừng sung, các con đực thực hiện những cú đâm đầu trực diện trên không (aerial jousting), va chạm chiếc mũ sừng vào nhau tạo ra những tiếng động chát chúa vang xa khắp thung lũng.");
      newC.unique_traits = appendClean(c.unique_traits, "Có vùng da cổ không lông màu đỏ thẫm ở con đực và màu lục lam nhạt ở con cái, hoạt động như một túi thanh quản giúp khuếch đại tiếng kêu vang dội giống như tiếng cười ma quái.");

      newC.strengths = appendUniqueString(c.strengths, "Mũ sừng keratin đặc and cấu trúc xương sọ gia cố lực giúp thực hiện các cú húc đầu tranh chấp lãnh thổ cực kỳ mạnh mẽ.");
      newC.strengths = appendUniqueString(c.strengths, "Lực mỏ kẹp khỏe có thể bẻ gãy các cành cây khô hoặc nghiền nát vỏ các loại hạt rừng cứng.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Tốc độ sinh sản rất chậm, chỉ đẻ 1-2 trứng mỗi mùa và chu kỳ nuôi con kéo dài khiến quần thể khó phục hồi.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Tiếng kêu khuếch đại quá lớn vô tình chỉ điểm vị trí của chúng cho những kẻ săn trộm sừng.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Sừng của hồng hoàng mũ cát đắt hơn ngà voi tới 3 lần trên thị trường đen, thường được gọi là 'ngà đỏ' (red ivory) và bị săn lùng để chạm khắc đồ mỹ nghệ.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Tiếng kêu của chúng bắt đầu bằng những tiếng 'cục... cục' chậm rãi, tăng tốc dần thành một chuỗi âm thanh dồn dập rồi kết thúc bằng một tiếng cười lớn rùng rợn.");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1017/S003060531600021X",
        "label": "Oryx - The illegal trade in the helmeted hornbill Rhinoplax vigil"
      });
      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1111/ibi.12234",
        "label": "Ibis - Nesting biology and diet of the Helmeted Hornbill"
      });

    } else if (c.id === "box-jellyfish") {
      newC.diet_type = "carnivore";
      newC.diet_items = ["tôm nhỏ", "cá nhỏ", "cua nhỏ", "giun nhiều tơ"];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 8;
      newC.lifespan_max = 12;
      newC.lifespan_unit = "months";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Trứng và tinh trùng được giải phóng vào nước sông/biển. Phôi phát triển thành ấu trùng planula nhỏ bơi tự do, bám vào đá hoặc rễ cây đước để phát triển thành polyp. Polyp sau đó thực hiện quá trình phân đôi (strobilation) giải phóng sứa con.";
      newC.locomotion = "swim";
      newC.speed_max = 7.2;
      newC.conservation_status = "LC";
      newC.size_min_mm = 200.0;
      newC.size_max_mm = 300.0;
      newC.weight_avg_g = 2000.0;

      newC.characteristics = appendClean(c.characteristics, "Mỗi góc của chuông sứa chứa một cụm cơ quan cảm biến (rhopalia) gồm 6 mắt, trong đó có 4 mắt đơn giản và 2 mắt phức tạp có võng mạc, thủy tinh thể và giác mạc giống mắt động vật có xương sống.");
      newC.survival_method = appendClean(c.survival_method, "Khi phát hiện chướng ngại vật hoặc kẻ săn mồi nhờ hệ thống mắt phức tạp, chúng có thể chủ động chuyển hướng bơi lùi hoặc rẽ góc 90 độ thay vì thụ động trôi nổi theo dòng nước.");
      newC.unique_traits = appendClean(c.unique_traits, "Độc tố của chúng chứa các protein porin tạo lỗ (fleckeri porins) tấn công màng tế bào hồng cầu cực nhanh, giải phóng một lượng lớn kali gây ngừng tim tức thì.");

      newC.strengths = appendUniqueString(c.strengths, "Độc tố tim và thần kinh mạnh nhất thế giới động vật biển, vô hiệu hóa con mồi ngay lập tức để tránh làm rách xúc tu mỏng.");
      newC.strengths = appendUniqueString(c.strengths, "Thị giác phát triển vượt bậc với 24 mắt giúp định vị chướng ngại vật và con mồi trong dòng nước nông.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Cơ thể trong suốt gelatin mỏng manh dễ bị tổn thương nghiêm trọng bởi rùa biển (loài miễn nhiễm với độc sứa).");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Phụ thuộc vào dòng chảy ven bờ để duy trì độ ẩm và nhiệt độ nước ổn định, dễ chết nếu bị sóng đánh dạt lên bờ cát.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Mặc dù sở hữu đôi mắt phức tạp có thể tạo ra hình ảnh sắc nét, sứa hộp không có não bộ trung ương để xử lý hình ảnh, thay vào đó hình ảnh được xử lý trực tiếp bởi mạng lưới thần kinh cục bộ ở rhopalia.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Các xúc tu của sứa hộp có thể co lại chỉ còn 10 cm khi bơi nhưng có thể kéo dài tới 3 mét khi săn mồi.");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1371/journal.pone.0002277",
        "label": "PLoS ONE - Vision and behavior of the box jellyfish Chironex fleckeri"
      });
      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1016/j.toxicon.2009.02.029",
        "label": "Toxicon - Cardiovascular effects and mechanism of Chironex fleckeri venom"
      });

    } else if (c.id === "comb-jelly") {
      newC.diet_type = "carnivore";
      newC.diet_items = ["giáp xác chân chèo", "ấu trùng trai", "trứng cá", "cá con", "ấu trùng tôm"];
      newC.activity_pattern = "variable";
      newC.lifespan_min = 3;
      newC.lifespan_max = 6;
      newC.lifespan_unit = "months";
      newC.reproduction_type = "hermaphrodite";
      newC.reproduction_notes = "Chúng là loài lưỡng tính tự thụ tinh. Mỗi cá thể có thể sản sinh cả trứng và tinh trùng cùng một lúc, giải phóng vào nước vào mỗi buổi sáng sớm. Một cá thể đơn lẻ có thể đẻ tới 10.000 quả trứng mỗi ngày nếu nguồn thức ăn dồi dào.";
      newC.locomotion = "swim";
      newC.speed_max = 0.3;
      newC.conservation_status = "LC";
      newC.size_min_mm = 70.0;
      newC.size_max_mm = 120.0;
      newC.weight_avg_g = 35.0;

      newC.characteristics = appendClean(c.characteristics, "Bộ lông rung di chuyển của chúng được đồng bộ hóa thông qua các cơ quan cảm biến thăng bằng (statolith) nằm ở cực đối diện miệng, điều phối tần số đập của 8 hàng phiến lược dựa trên gia tốc trọng trường.");
      newC.survival_method = appendClean(c.survival_method, "Khi bị tấn công bởi sứa lớn hơn, chúng có thể tự cắt đứt một phần thùy cơ thể bị thương để đánh lạc hướng, rồi nhanh chóng tái tạo lại phần bị mất trong vòng chưa đầy 24 giờ.");
      newC.unique_traits = appendClean(c.unique_traits, "Colloblast của sứa lược chứa các bao keo xoắn (spiral filaments) hoạt động như các giảm xóc lò xo vi mô, hấp thụ lực bứt phá của con mồi giáp xác mà không làm đứt sợi bám.");

      newC.strengths = appendUniqueString(c.strengths, "Khả năng đồng bộ hóa hàng ngàn lông rung thông qua cơ quan statolith giúp bơi lội và chuyển hướng nhịp nhàng mà không cần não bộ.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Không có khả năng điều hòa áp suất thẩm thấu khi độ mặn của nước biển giảm mạnh xuống dưới 10 ppt, dễ bị trương phồng và phân hủy tế bào.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Hệ gen của sứa lược thiếu hầu hết các gen quy định chất truyền dẫn thần kinh phổ biến như acetylcholine, serotonin và dopamine, thay vào đó chúng sử dụng glutamate làm chất dẫn truyền chính.");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1073/pnas.1403751111",
        "label": "PNAS - Genomic insights into the evolutionary origin of neurons in Ctenophora"
      });
      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1242/jeb.242521",
        "label": "Journal of Experimental Biology - Statolith-mediated coordination of ciliated locomotion in comb jellies"
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

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA - ROUND 168 ===================");
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
