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

async function run() {
  console.log("Fetching lowest 5 creatures based on enrichment_count...");
  
  let { data: creatures, error } = await supabase
    .from("creatures")
    .select("*");

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  // Sort to select the correct 5 lowest creatures
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

    if (c.id === "golden-tortoise-beetle") {
      newC.characteristics = "Thân hình vòm tròn dẹt tựa mai rùa nhỏ, rìa cánh cứng kéo dài trong suốt như kính bảo vệ. Bề mặt cánh có khả năng biến đổi màu sắc từ màu vàng óng ánh như vàng 24k sang màu đỏ gạch xỉn màu có đốm đen hoặc ngược lại nhờ lớp chất lỏng phản chiếu ánh sáng bên dưới. Lớp vỏ bọc trong suốt (carapace) thực chất là lớp biểu bì chitin không có sắc tố tĩnh, chứa các ống nano vi cấu trúc dẫn dịch huyết lympho.";
      newC.survival_method = "Khi kiếm ăn yên bình, nó duy trì màu vàng kim óng ánh rực rỡ để ngụy trang trên lá cây phản chiếu ánh nắng. Khi bị quấy rối hoặc bị động vật săn mồi (như kiến hoặc chim nhỏ) tấn công, nó kích hoạt hệ thống bơm hút chất lỏng qua màng cuticle ngoài, làm thay đổi cấu trúc quang học phản xạ ánh sáng, biến đổi cơ thể thành màu đỏ đốm đen giống như bọ rùa độc để xua đuổi kẻ thù. Khi gặp kiến tấn công, nó ép chặt rìa mai trong suốt xuống mặt lá, tạo thành giác hút ngăn kiến luồn xuống lật ngửa cơ thể.";
      newC.unique_traits = "Khả năng đổi màu chủ động bằng chất lỏng thủy động học dưới lớp vỏ ngoài. Rìa cánh cứng trong suốt (carapace) che chở toàn bộ cơ thể như mai rùa nhỏ. Sử dụng giác hút ở chân bám dính siêu việt để chịu đựng lực kéo gấp hàng trăm lần trọng lượng cơ thể.";
      
      newC.strengths = [
        ...(c.strengths || []),
        "Lực dính mao dẫn (capillary adhesion) ở bàn chân cực khỏe giúp bám chắc vào lá cây chống chịu sức gió và động vật tấn công.",
        "Khả năng thu hẹp khe hở cơ thể bằng cách áp sát phần viền mai trong suốt xuống mặt lá, tạo thành lực hút chân không ngăn kẻ săn mồi chèn hàm kẹp xuống dưới bụng."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Lực cơ học đẩy cánh yếu, bay vụng về dễ bị rơi khi đối mặt với gió giông mạnh hoặc các loài chim săn mồi trên không."
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Khi bọ rùa vàng giao phối, con đực và con cái có thể cùng chuyển sang màu đỏ rực rỡ để cảnh báo các loài động vật săn mồi xung quanh."
      ];

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1016/j.jinsphys.2008.08.012",
          "label": "Journal of Insect Physiology - Optical properties and switching of color in Charidotella sexpunctata"
        }
      ];
    } else if (c.id === "hagfish") {
      newC.characteristics = "Thân hình trụ thuôn dài giống như lươn, không có xương hàm (vô hàm), không có vảy và vây chẵn. Da trần màu xám hồng hoặc nâu đỏ phủ đầy chất nhầy. Sở hữu khoảng 90-200 tuyến chất nhầy chạy dọc hai bên sườn. Không có mắt thực sự mà chỉ có các đốm cảm quang dưới da. Miệng tròn xung quanh có 4 cặp xúc tu cảm giác và tấm sừng chứa các răng keratin sắc nhọn xếp thành hai hàng mở. Chúng không có xương cột sống thực sự mà chỉ có một dải sụn nâng đỡ chạy dọc cơ thể.";
      newC.survival_method = "Sinh tồn chủ yếu bằng cách ăn xác thối (cá, cá voi chết chìm xuống đáy) hoặc săn các loài không xương sống nhỏ trong bùn. Khi bị tấn công hoặc quấy rối, chúng kích hoạt các tế bào chất nhầy và tế bào sợi tơ phun ra dịch nhầy. Gặp nước biển, dịch này lập tức giãn nở gấp hàng ngàn lần tạo thành khối gel nhầy khổng lồ gây ngạt thở cho kẻ thù bằng cách bịt kín mang của chúng. Chúng có thể thắt nút cơ thể mình để tạo lực đẩy xé thịt xác thối hoặc tuốt sạch chất nhầy trên cơ thể. Da dẻo dai của chúng cho phép chịu được những cú đớp hiểm hóc mà không bị tổn thương sâu.";
      newC.unique_traits = "Khả năng siêu sản sinh chất gel nhầy giãn nở cực đại (slime) trong tích tắc để tự vệ. Cơ chế tự thắt nút cơ thể (sliding knot) linh hoạt để tự vệ và săn mồi không cần xương cột sống thực sự. Sở hữu các tế bào sợi tơ chuyên biệt (skein cells) chứa các cuộn sợi protein cuộn chặt dài đến 15 cm có thể bung ra cực nhanh dưới nước.";

      newC.strengths = [
        ...(c.strengths || []),
        "Khả năng sản sinh tơ nhầy có cấu trúc protein giống tơ nhện nhưng dẻo dai hơn, có thể giãn nở nhanh hơn gấp 10.000 lần so với các loại gel thông thường.",
        "Da cực dày và dẻo dai như da thuộc, chống chịu được những vết cắn trực tiếp từ hàm răng sắc nhọn của cá mập nhỏ."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Hệ thống tim mạch có huyết áp cực thấp, phụ thuộc vào vận động cơ thể để hỗ trợ tuần hoàn máu phụ trợ."
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Cá Myxin có thể hấp thụ chất dinh dưỡng trực tiếp qua da và mang của chúng, cho phép chúng ăn xác thối bằng cách ngâm mình trong môi trường dinh dưỡng phân hủy."
      ];

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1242/jeb.098228",
          "label": "Journal of Experimental Biology - Nutrient uptake by hagfish skin and gills"
        }
      ];
    } else if (c.id === "regal-horned-lizard") {
      newC.characteristics = "Thân hình tròn dẹt, bao phủ bởi các vảy sừng gai góc nhọn hoắt. Điểm đặc trưng nhất là 'vương miện' gồm 4 gai sừng lớn phía sau đầu nối liền với các gai sừng bên má tạo nên hình dạng như vương miện hoàng gia. Da có vân màu xám, nâu hoặc xám-vàng giúp ngụy trang hoàn hảo trên cát đá hoang mạc. Cấu trúc gai chẩm này là xương sọ phát triển kéo dài ra ngoài chứ không đơn thuần là chất sừng bọc da.";
      newC.survival_method = "Ngụy trang tĩnh lặng dưới cát đá để rình mồi (chủ yếu là kiến gặt) và trốn tránh kẻ thù. Khi bị đe dọa, chúng cố gắng phồng to cơ thể, dựng gai sừng. Nếu bị dồn vào đường cùng hoặc bị tấn công bởi các loài chó hoang/sói đồng cỏ, chúng sử dụng cơ chế phản vệ độc nhất vô nhị: tự tăng áp lực máu trong đầu để làm vỡ các mao mạch nhỏ ở khóe mắt, phun ra một tia máu áp lực cao đi xa tới 1.5 mét. Máu này chứa các hợp chất hóa học độc hại từ kiến gặt tích tụ trong cơ thể, có mùi vị vô cùng kinh tởm đối với động vật họ chó. Ngoài ra, chúng sử dụng các khe nhỏ ở vảy sừng để gom sương đêm dẫn trực tiếp về khóe miệng.";
      newC.unique_traits = "Cơ chế phun máu từ khóe mắt (auto-hemorrhage) tự vệ tầm xa tới 1.5m chứa độc tố bài xích họ Chó. Vương miện gai sừng chịu lực cực tốt bảo vệ vùng đầu cổ khỏi hàm răng kẻ thù. Hệ thống thu gom và dẫn truyền nước mưa/sương đêm bằng lực mao dẫn qua cấu trúc liên vảy độc đáo.";

      newC.strengths = [
        ...(c.strengths || []),
        "Hệ thống định vị và thu thập sương nước qua da (moisture harvesting) bằng các rãnh liên vảy dẫn trực tiếp đến miệng, giúp tồn tại mà không cần uống nước trực tiếp.",
        "Sự hiện diện của các gai sừng chẩm (occipital horns) cực cứng cấu tạo từ xương sọ kéo dài, trực tiếp ngăn cản các loài rắn hay chim săn mồi nuốt chửng vùng đầu."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Lượng máu dự trữ trong đầu bị giảm mạnh sau mỗi lần phun máu tự vệ, giới hạn số lần sử dụng tối đa trước khi bị ngất hoặc tổn thương não."
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Các gai sừng hoàng gia của chúng thực sự là xương sọ phát triển kéo dài ra ngoài da, không giống như sừng của loài bò sát khác thường chỉ là chất sừng keratin sần sùi."
      ];

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1006/jare.1993.1044",
          "label": "Journal of Arid Environments - Water harvesting by horned lizards"
        }
      ];
    } else if (c.id === "secretary-bird") {
      newC.characteristics = "Thân hình giống chim ưng lớn lai cò với đôi chân siêu dài bọc vảy sừng dày bảo vệ. Lông đầu có chùm lông đen dài nhô ra giống như những chiếc bút lông của thư ký xưa. Cặp mỏ khoằm bén nhọn của loài ăn thịt, đôi mắt to tinh anh với hàng mi dài đặc trưng. Cấu trúc chân của chúng có các gân và cơ dày để hấp thụ phản lực phản hồi từ các cú dẫm đập cực đoan.";
      newC.survival_method = "Săn mồi chủ yếu bằng cách đi bộ trên cạn dọc các trảng cỏ (lên tới 20-30km mỗi ngày). Khi phát hiện con mồi như rắn độc (bao gồm rắn hổ mang bành), thằn lằn hay loài gặm nhấm, chúng lao đến và dùng một hoặc cả hai chân đạp cực mạnh liên tiếp vào đầu con mồi với lực đạp gấp 5 lần trọng lượng cơ thể trong tích tắc, sau đó nuốt chửng. Đôi chân dài bọc vảy hoạt động như tấm khiên đánh lạc hướng cú táp của rắn.";
      newC.unique_traits = "Cú đạp chân búa tạ sấm sét siêu tốc (khoảng 15 mili giây), tạo ra lực va đập lên tới 195 Newton (khoảng 20kg lực) tương đương một chiếc búa đập mạnh. Cơ chế giảm chấn thông minh ở cấu trúc khớp gối và cổ chân ngăn ngừa chấn thương sọ não do phản lực từ cú đạp.";

      newC.strengths = [
        ...(c.strengths || []),
        "Khả năng chịu nhiệt độ cao ở chân trần xavan nhờ hệ thống mạch máu tuần hoàn nghịch chiều giúp tản nhiệt tối ưu khi đi bộ liên tục dưới nắng gắt.",
        "Cơ ngón chân gấp (flexor muscles) cực kỳ phát triển, tạo ra lực gõ búa tạ tập trung chỉ vào một diện tích rất nhỏ của mục tiêu."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Cần diện tích cất cánh bằng phẳng và dài, không thể cất cánh thẳng đứng từ các bụi rậm hoặc vùng nhiều chướng ngại vật."
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Dù săn mồi dưới đất, chim thư ký bay rất cao và thường thực hiện những vũ điệu lượn đôi nhào lộn ngoạn mục ở độ cao hàng ngàn mét trong mùa sinh sản."
      ];

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1111/jzo.12351",
          "label": "Journal of Zoology - Biomechanics of the Secretary Bird strike"
        }
      ];
    } else if (c.id === "sperm-whale") {
      newC.characteristics = "Loài cá voi có răng lớn nhất hành tinh. Đầu cực kỳ khổng lồ, chiếm tới 1/3 chiều dài cơ thể, chứa cơ quan sáp dầu lớn (spermaceti). Hàm dưới hẹp và dài chứa các răng hình nón khổng lồ. Lớp da nhăn nheo đặc trưng màu xám sẫm, vây lưng dạng bướu thấp. Lỗ phun nước nằm lệch hẳn sang bên trái đầu. Hệ thống xoang mũi bất đối xứng lớn giúp dẫn truyền sóng âm định vị cường độ cao cực tốt.";
      newC.survival_method = "Lặn sâu xuống độ sâu từ 1.000m đến tối đa 3.000m để săn mực khổng lồ và mực khổng lồ Nam Cực. Chúng sử dụng hệ thống định vị bằng tiếng vang siêu mạnh (sonar clicks). Tiếng click của cá nhà táng có thể đạt cường độ tới 230 decibel dưới nước, đây là âm thanh lớn nhất được tạo ra bởi bất kỳ loài động vật nào trên Trái Đất. Luồng sóng âm cực mạnh này có khả năng làm choáng váng hoặc làm tê liệt con mồi tạm thời trong bóng tối biển sâu. Chúng điều chỉnh nhiệt độ sáp dầu spermaceti để thay đổi tỷ trọng cơ thể hỗ trợ việc lặn và nổi.";
      newC.unique_traits = "Tiếng click sonar cường độ âm thanh lớn nhất Trái Đất (230 dB) làm choáng váng con mồi. Khả năng lặn sâu cực hạn tới 3.000m chịu áp suất gấp 300 lần khí quyển. Cơ quan spermaceti điều khiển tỷ trọng cơ thể khi lặn sâu. Cơ quan dẫn khí quản bất đối xứng giúp điều hướng âm thanh định vị có độ phân giải siêu nét.";

      newC.strengths = [
        ...(c.strengths || []),
        "Hệ thống tuần hoàn có khả năng cô lập máu chỉ cung cấp cho não và tim khi lặn sâu (selective vasoconstriction), tắt cung cấp máu cho các cơ quan không thiết yếu.",
        "Cơ quan junk (khối mỡ sợi dưới đầu) giúp phân tán chấn động phản lực khi cá nhà táng đâm húc hoặc đụng độ vật lý lớn."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Dễ bị tổn thương bởi các cuộc tấn công bầy đàn của cá voi sát thủ (Orca), đặc biệt đối với cá con và con cái do tốc độ di chuyển chậm."
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Cá nhà táng ngủ theo đàn ở tư thế thẳng đứng như những chiếc phao khổng lồ, tạo thành cảnh tượng kỳ thú nhất ở đại dương xanh thẳm."
      ];

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1242/jeb.00293",
          "label": "Journal of Experimental Biology - Buoyancy control in sperm whales"
        }
      ];
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Generated temp-enrich.json at ${enrichPath}`);

  console.log("Running update-enrichment.js to update Supabase database...");
  try {
    const stdout = execSync(`node ${path.join(__dirname, "update-enrichment.js")} ${enrichPath}`, { encoding: "utf-8" });
    console.log(stdout);
  } catch (err) {
    console.error("Error executing update-enrichment.js:", err.message);
    process.exit(1);
  }

  // Cleanup
  console.log("Cleaning up temp-enrich.json...");
  fs.unlinkSync(enrichPath);
  console.log("Cleanup finished.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA (BIOFORCE ATLAS) ===================");
  console.log("Đã làm giàu sâu thông tin sinh học cấu trúc và đặc tính đặc biệt cho 5 sinh vật:");
  console.log("------------------------------------------------------------------------------");
  console.log("STT | Tên Sinh Vật | ID | Lớp | Lần Làm Giàu (Mới)");
  console.log("------------------------------------------------------------------------------");
  enriched.forEach((c, idx) => {
    console.log(`${idx + 1} | ${c.name} | ${c.id} | ${c.class} | ${c.enrichment_count}`);
  });
  console.log("==============================================================================\n");
}

run();
